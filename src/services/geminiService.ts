import { GoogleGenAI, Type } from "@google/genai";
import type { ComplianceReport, CustomRule, CheckItem } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const createErrorResponse = (summary: string, details: string): ComplianceReport => ({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    overallScore: 0,
    summary,
    checks: [{ name: "Configuration Error", status: "fail", details }],
    sourceContent: "",
    analysisType: 'text',
    userName: getUserName(),
    recommendedStatus: 'revision',
});

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
          name: { type: Type.STRING, description: "The name of the compliance check (e.g., 'FTC Disclosure', 'Brand Safety', 'Custom Rule: #BrandPartner'). Use the prefix 'Custom Rule:' for custom rule checks." },
          status: { type: Type.STRING, description: "The result of the check. Must be one of: 'pass', 'fail', or 'warn'.", enum: ['pass', 'fail', 'warn'] },
          details: { type: Type.STRING, description: "A detailed explanation of why the check passed, failed, or has a warning. Provide specifics." }
        },
        required: ["name", "status", "details"]
      }
    },
    recommendedStatus: { type: Type.STRING, description: "Your recommended next step. If the score is >= 90 and no checks fail, recommend 'approved'. Otherwise, recommend 'revision'.", enum: ['approved', 'revision'] }
  },
  required: ["overallScore", "summary", "checks", "recommendedStatus"]
};

const multimodalComplianceSchema = {
    type: Type.OBJECT,
    properties: {
      overallScore: { type: Type.INTEGER, description: "A compliance score from 0 to 100, where 100 is fully compliant, based on analysis of all provided modalities (text, image, audio)." },
      summary: { type: Type.STRING, description: "A brief, one-sentence summary of the compliance check results from all modalities." },
      checks: {
        type: Type.ARRAY,
        description: "An array of specific compliance checks that were performed.",
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The name of the compliance check (e.g., 'Spoken Disclosure', 'Visual Brand Safety'). Use the prefix 'Custom Rule:' for custom rule checks." },
            status: { type: Type.STRING, description: "The result of the check. Must be one of: 'pass', 'fail', or 'warn'.", enum: ['pass', 'fail', 'warn'] },
            details: { type: Type.STRING, description: "A detailed explanation of why the check passed, failed, or has a warning. Provide specifics." },
            modality: { type: Type.STRING, description: "The modality of the check. Must be one of 'audio', 'visual', or 'text'.", enum: ['audio', 'visual', 'text'] }
          },
          required: ["name", "status", "details", "modality"]
        }
      },
      recommendedStatus: { type: Type.STRING, description: "Your recommended next step. If the score is >= 90 and no checks fail, recommend 'approved'. Otherwise, recommend 'revision'.", enum: ['approved', 'revision'] }
    },
    required: ["overallScore", "summary", "checks", "recommendedStatus"]
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

// Helper to get user name for demo purposes.
// In a real app, this would be handled server-side with the authenticated user ID.
const getUserName = (): string => {
    return localStorage.getItem('brandGuardUser') || 'Anonymous';
}


export const transcribeVideo = async (videoFile: File): Promise<string> => {
    if (!ai) return Promise.reject(new Error("VITE_GEMINI_API_KEY is not configured."));

    const videoData64 = await fileToBase64(videoFile);
    const prompt = "Provide a full and accurate transcript of the audio in the provided video file. Return only the transcribed text, with no additional commentary or formatting.";
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
            parts: [
                { text: prompt },
                { inlineData: { mimeType: videoFile.type, data: videoData64 } }
            ]
        }
    });

    return response.text.trim();
};

export const analyzePostContent = async (postContent: string, customRules?: CustomRule[]): Promise<ComplianceReport> => {
    if (!ai) return Promise.resolve(createErrorResponse("API Key Missing", "The VITE_GEMINI_API_KEY is not configured. Please add it to your environment variables."));

    const userName = getUserName();
    const fullPrompt = `Act as an expert social media compliance officer for a major brand. Your task is to analyze the following sponsored post caption for compliance with FTC guidelines, brand safety, and specific campaign requirements.\n\n**Post Caption to Analyze:**\n"${postContent}"\n\n**Standard Compliance Rules:**\n1.  **FTC Disclosure:** The post MUST contain a clear and conspicuous disclosure, such as #ad, #sponsored, or "Paid partnership".\n2.  **Brand Safety:** The post must NOT contain any profanity, offensive language, or controversial topics.\n3.  **Claim Accuracy:** The post must accurately represent the product and mention "made with 100% organic materials".\n${generateCustomRulesPrompt(customRules)}\nPlease provide a strict analysis, recommend a status, and return the results in the required JSON format.`;
    
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: fullPrompt, config: { responseMimeType: "application/json", responseSchema: complianceSchema }});
    let partialReport;
    try {
        partialReport = JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", response.text);
        partialReport = {
            overallScore: 0,
            summary: "Error: The AI returned an invalid response. This may be due to content safety filters or an internal error. Please check your content or try again.",
            checks: [{
                name: "Response Error",
                status: "fail",
                details: "Could not parse the JSON response from the AI. The raw response was logged to the console."
            }],
            recommendedStatus: 'revision'
        };
    }
    return { ...partialReport, id: crypto.randomUUID(), timestamp: new Date().toISOString(), sourceContent: postContent, analysisType: 'text', customRulesApplied: customRules, userName };
};

export const analyzeImageContent = async (caption: string, imageFile: File, customRules?: CustomRule[]): Promise<ComplianceReport> => {
    if (!ai) return Promise.resolve(createErrorResponse("API Key Missing", "The VITE_GEMINI_API_KEY is not configured. Please add it to your environment variables."));
    
    const userName = getUserName();
    const imageData64 = await fileToBase64(imageFile);
    const prompt = `Act as an expert social media compliance officer. Analyze the provided image and its caption for compliance. You must check BOTH the visual content and the text content.\n\n**Image Caption for Text Analysis:**\n"${caption}"\n\n**Standard Compliance Rules:**\n1.  **FTC Disclosure (Text):** The caption must contain a clear disclosure (e.g., #ad, #sponsored).\n2.  **Brand Safety (Visual & Text):** No profanity in text, no inappropriate imagery.\n3.  **Brand Representation (Visual):** The product must be clearly visible and not depicted negatively.\n${generateCustomRulesPrompt(customRules)}\nProvide a strict analysis covering both modalities ('visual' for image, 'text' for caption), recommend a status, and return the results in the required JSON format.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: prompt }, { inlineData: { mimeType: imageFile.type, data: imageData64 } }] },
        config: { responseMimeType: "application/json", responseSchema: multimodalComplianceSchema }
    });
    let partialReport;
    try {
        partialReport = JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", response.text);
        partialReport = {
            overallScore: 0,
            summary: "Error: The AI returned an invalid response. This may be due to content safety filters or an internal error. Please check your content or try again.",
            checks: [{
                name: "Response Error",
                status: "fail",
                details: "Could not parse the JSON response from the AI. The raw response was logged to the console."
            }],
            recommendedStatus: 'revision'
        };
    }
    return { ...partialReport, id: crypto.randomUUID(), timestamp: new Date().toISOString(), sourceContent: caption, analysisType: 'image', customRulesApplied: customRules, sourceMedia: { data: imageData64, mimeType: imageFile.type }, userName };
};


export const analyzeVideoContent = async (videoTranscript: string, videoFile: File, customRules?: CustomRule[]): Promise<ComplianceReport> => {
    if (!ai) return Promise.resolve(createErrorResponse("API Key Missing", "The VITE_GEMINI_API_KEY is not configured. Please add it to your environment variables."));
    
    const userName = getUserName();
    const videoData64 = await fileToBase64(videoFile);
    const actualFullPrompt = `Act as an expert social media compliance officer. Analyze the provided video and its transcript for compliance with FTC guidelines, brand safety, and custom campaign requirements. You must perform checks on BOTH the visual content of the video and the audio content from the transcript.\n\n**Video Transcript for Audio Analysis:**\n"${videoTranscript}"\n\n**Standard Compliance Rules (Check both Audio & Visuals):**\n1.  **FTC Disclosure:** Audio must contain a spoken disclosure, and visuals should have a text overlay.\n2.  **Brand Safety:** No profanity in audio, no inappropriate imagery in visuals.\n3.  **Brand Representation:** Speaker must mention "made with 100% organic materials", product must be clearly visible.\n${generateCustomRulesPrompt(customRules)}\nProvide a strict analysis covering both modalities, recommend a status, and return the results in the required JSON format. For each check, specify the modality as 'audio' or 'visual'.`;

    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: { parts: [{ text: actualFullPrompt }, { inlineData: { mimeType: videoFile.type, data: videoData64 } }] }, config: { responseMimeType: "application/json", responseSchema: multimodalComplianceSchema }});
    let partialReport;
    try {
        partialReport = JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", response.text);
        partialReport = {
            overallScore: 0,
            summary: "Error: The AI returned an invalid response. This may be due to content safety filters or an internal error. Please check your content or try again.",
            checks: [{
                name: "Response Error",
                status: "fail",
                details: "Could not parse the JSON response from the AI. The raw response was logged to the console."
            }],
            recommendedStatus: 'revision'
        };
    }
    // FIX: Corrected typo `new D ate()` to `new Date()`.
    return { ...partialReport, id: crypto.randomUUID(), timestamp: new Date().toISOString(), sourceContent: videoTranscript, analysisType: 'video', customRulesApplied: customRules, sourceMedia: { data: videoData64, mimeType: videoFile.type }, userName };
};

export const generateCompliantRevision = async (originalContent: string, analysisType: 'text' | 'video' | 'image', failedChecks: CheckItem[]): Promise<string> => {
    if (!ai) return Promise.resolve("Cannot generate revision: API Key is missing.");

    const issues = failedChecks.filter(c => c.modality !== 'visual' && c.modality !== 'audio').map(check => `- ${check.name} (${check.modality || 'text'}): ${check.details}`).join('\n');
    if (!issues) {
        return "The identified issues are purely visual or audio-based and cannot be fixed by revising the text caption. Please address the media content directly.";
    }
    const prompt = `Act as an expert social media copywriter. Your task is to revise the following ${analysisType === 'text' ? 'Post Caption' : 'Image Caption or Video Script'} to make it fully compliant based on the text-based issues identified.\n\n**Original Content:**\n"${originalContent}"\n\n**Identified Issues:**\n${issues}\n\n**Instructions:**\nRewrite the content to fix ALL identified text-based issues. Maintain the original tone. Output ONLY the revised text.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return response.text.trim();
};
