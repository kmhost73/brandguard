import { GoogleGenAI, Type } from "@google/genai";
import type { ComplianceReport, CustomRule, CheckItem } from '../types';

// This is the correct way to access environment variables in a Vite project.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not set. Please add it to your .env file or Vercel environment variables.");
}
const ai = new GoogleGenAI({ apiKey });


const complianceSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER, description: "A compliance score from 0 to 100, where 100 is fully compliant." },
    summary: { type: Type.STRING, description: "A brief, one-sentence summary of the compliance check results." },
    checks: {
      type: Type.ARRAY,
      description: "An array of specific compliance checks that were performed.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The name of the compliance check (e.g., 'FTC Disclosure', 'Brand Safety', 'Custom Rule: #BrandPartner'). Use the prefix 'Custom Rule:' for user-defined rules." },
          status: { type: Type.STRING, description: "The result of the check. Must be one of: 'pass', 'fail', or 'warn'.", enum: ['pass', 'fail', 'warn'] },
          details: { type: Type.STRING, description: "A detailed explanation of why the check passed, failed, or has a warning. Provide specifics." }
        },
        required: ["name", "status", "details"]
      }
    }
  },
  required: ["overallScore", "summary", "checks"]
};

const videoComplianceSchema = {
    type: Type.OBJECT,
    properties: {
      overallScore: { type: Type.INTEGER, description: "A compliance score from 0 to 100, where 100 is fully compliant, based on both visual and audio analysis." },
      summary: { type: Type.STRING, description: "A brief, one-sentence summary of the compliance check results from both video and audio." },
      checks: {
        type: Type.ARRAY,
        description: "An array of specific compliance checks that were performed on the video and its transcript.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The name of the compliance check (e.g., 'Spoken Disclosure', 'Visual Brand Safety', 'Custom Rule: Mention 'Free Shipping''). Use the prefix 'Custom Rule:' for user-defined rules." },
            status: { type: Type.STRING, description: "The result of the check. Must be one of: 'pass', 'fail', or 'warn'.", enum: ['pass', 'fail', 'warn'] },
            details: { type: Type.STRING, description: "A detailed explanation of why the check passed, failed, or has a warning. Provide specifics." },
            modality: { type: Type.STRING, description: "The modality of the check. Use 'audio' for checks on the transcript and 'visual' for checks on the video frames.", enum: ['audio', 'visual'] }
          },
          required: ["name", "status", "details", "modality"]
        }
      }
    },
    required: ["overallScore", "summary", "checks"]
};


const generateCustomRulesPrompt = (customRules?: CustomRule[]): string => {
    if (!customRules || customRules.length === 0) return "";
    const rulesText = customRules.map((rule, index) => `${index + 1}. ${rule.text}`).join('\n');
    return `\n**Additional Custom Campaign Rules:**\nYou MUST strictly enforce the following custom rules provided by the user. For each custom rule, create a separate check in the output JSON with the name prefixed by "Custom Rule:".\n${rulesText}\n`;
}

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = (reader.result as string).split(',')[1];
        if (result) {
            resolve(result);
        } else {
            reject(new Error("Failed to convert file to base64."));
        }
    };
    reader.onerror = (error) => reject(error);
});

export const analyzePostContent = async (postContent: string, customRules?: CustomRule[]): Promise<ComplianceReport> => {
    const fullPrompt = `Act as an expert social media compliance officer for a major brand. Your task is to analyze the following sponsored post caption for compliance with FTC guidelines, brand safety, and specific campaign requirements.\n\n**Post Caption to Analyze:**\n"${postContent}"\n\n**Standard Compliance Rules:**\n1.  **FTC Disclosure:** The post MUST contain a clear and conspicuous disclosure, such as #ad, #sponsored, or "Paid partnership".\n2.  **Brand Safety:** The post must NOT contain any profanity, offensive language, or controversial topics.\n3.  **Claim Accuracy:** The post must accurately represent the product and mention "made with 100% organic materials".\n${generateCustomRulesPrompt(customRules)}\nPlease provide a strict analysis and return the results in the required JSON format.`;
    
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: fullPrompt, config: { responseMimeType: "application/json", responseSchema: complianceSchema }});
    const partialReport = JSON.parse(response.text);
    return { ...partialReport, id: crypto.randomUUID(), timestamp: new Date().toISOString(), sourceContent: postContent, analysisType: 'text', customRulesApplied: customRules };
};

export const analyzeVideoContent = async (videoTranscript: string, videoFile: File, customRules?: CustomRule[]): Promise<ComplianceReport> => {
    const videoData64 = await fileToBase64(videoFile);
    const actualFullPrompt = `Act as an expert social media compliance officer. Analyze the provided video and its transcript for compliance with FTC guidelines, brand safety, and custom campaign requirements. You must perform checks on BOTH the visual content of the video and the audio content from the transcript.\n\n**Video Transcript for Audio Analysis:**\n"${videoTranscript}"\n\n**Standard Compliance Rules (Check both Audio & Visuals):**\n1.  **FTC Disclosure:** Audio must contain a spoken disclosure, and visuals should have a text overlay.\n2.  **Brand Safety:** No profanity in audio, no inappropriate imagery in visuals.\n3.  **Brand Representation:** Speaker must mention "made with 100% organic materials", product must be clearly visible.\n${generateCustomRulesPrompt(customRules)}\nProvide a strict analysis covering both modalities and return the results in the required JSON format. For each check, specify the modality as 'audio' or 'visual'.`;

    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: { parts: [{ text: actualFullPrompt }, { inlineData: { mimeType: videoFile.type, data: videoData64 } }] }, config: { responseMimeType: "application/json", responseSchema: videoComplianceSchema }});
    const partialReport = JSON.parse(response.text);
    return { ...partialReport, id: crypto.randomUUID(), timestamp: new Date().toISOString(), sourceContent: videoTranscript, analysisType: 'video', customRulesApplied: customRules };
};

export const generateCompliantRevision = async (originalContent: string, analysisType: 'text' | 'video', failedChecks: CheckItem[]): Promise<string> => {
    const issues = failedChecks.map(check => `- ${check.name} (${check.modality || 'text'}): ${check.details}`).join('\n');
    const prompt = `Act as an expert social media copywriter. Your task is to revise the following ${analysisType === 'text' ? 'Post Caption' : 'Video Script'} to make it fully compliant based on the issues identified.\n\n**Original Content:**\n"${originalContent}"\n\n**Identified Issues:**\n${issues}\n\n**Instructions:**\nRewrite the content to fix ALL issues. Maintain the original tone. Output ONLY the revised text.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text.trim();
};