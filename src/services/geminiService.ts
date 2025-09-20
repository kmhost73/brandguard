import { GoogleGenAI, Type, Modality } from "@google/genai";
// FIX: Add GreenlightBrief to type imports for the new feature.
import type { ComplianceReport, CustomRule, CheckItem, GreenlightBrief } from '../types';

// FIX: Workaround for TypeScript errors when accessing Vite environment variables.
// The reference to "vite/client" types was not being found in the provided environment.
// Casting `import` to `any` resolves the property access error without needing project-level configuration changes.
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY;

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

/**
 * A wrapper for the Gemini API's generateContent method that includes
 * automatic retry logic for transient errors and user-friendly error mapping.
 * @param request The parameters for the generateContent call.
 * @returns The response from the Gemini API.
 */
async function generateContentWithRetry<T>(request: T): Promise<any> {
    if (!ai) throw new Error("VITE_GEMINI_API_KEY is not configured.");

    const maxRetries = 1;
    let attempt = 0;

    const attemptRequest = async (): Promise<any> => {
        try {
            // @ts-ignore
            return await ai.models.generateContent(request);
        } catch (e: any) {
            console.error(`Gemini API Error (Attempt ${attempt + 1}):`, e);

            const isRetryable = e.message && (
                e.message.includes('overloaded') ||
                e.message.includes('UNAVAILABLE') ||
                (e.status && e.status === 'UNAVAILABLE')
            );

            if (attempt < maxRetries && isRetryable) {
                attempt++;
                console.warn(`Retryable error detected. Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return attemptRequest();
            }

            if (e.message && e.message.toLowerCase().includes('safety')) {
                 throw new Error("The request was blocked due to the content safety policy. Please modify your input and try again.");
            }
            if (isRetryable) {
                throw new Error("The compliance engine is currently under heavy load. Please try your request again in a few moments.");
            }
             if (e.message && e.message.includes('API key not valid')) {
                throw new Error("The configured API Key is invalid. Please check your configuration.");
            }
            throw new Error("An unexpected error occurred while communicating with the compliance engine. Check the console for details.");
        }
    };
    
    return attemptRequest();
}


const createErrorResponse = (summary: string, details: string): Omit<ComplianceReport, 'workspaceId'> => ({
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
          name: { type: Type.STRING, description: "The name of the compliance check (e.g., 'FTC Disclosure', 'Brand Safety', 'Custom Rule: Must be upbeat'). Use the prefix 'Custom Rule:' for custom rule checks, followed by the user's intent." },
          status: { type: Type.STRING, description: "The result of the check. Must be one of: 'pass', 'fail', or 'warn'.", enum: ['pass', 'fail', 'warn'] },
          details: { type: Type.STRING, description: "A detailed explanation of why the check passed, failed, or has a warning. Provide specifics." }
        },
        required: ["name", "status", "details"]
      }
    },
    recommendedStatus: { type: Type.STRING, description: "Your recommended next step. If the score is >= 90 and no checks fail, recommend 'approved'. Otherwise, recommend 'revision'.", enum: ['approved', 'revision'] },
    suggestedRevision: { type: Type.STRING, description: "If the recommendedStatus is 'revision', provide a revised, fully compliant version of the post caption. If the status is 'approved', return an empty string." }
  },
  required: ["overallScore", "summary", "checks", "recommendedStatus", "suggestedRevision"]
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

const testScenarioSchema = {
    type: Type.OBJECT,
    properties: {
        postContent: { type: Type.STRING, description: "The full text of the generated social media post to be tested." },
        expectedSummary: { type: Type.STRING, description: "A brief justification for why this post should pass or fail, explaining the specific compliance issue or lack thereof." },
        expectedScoreText: { type: Type.STRING, description: "A human-readable string of the expected score range, e.g., '>= 90' for a pass or '< 90' for a fail/warn." },
        expectedToPass: { type: Type.BOOLEAN, description: "A boolean indicating if the generated post is expected to be fully compliant (true) or not (false)." }
    },
    required: ["postContent", "expectedSummary", "expectedScoreText", "expectedToPass"]
};

const ruleArchitectSchema = {
    type: Type.OBJECT,
    properties: {
        description: { type: Type.STRING, description: "A detailed, specific, and clear rule for an AI to follow, based on the user's intent. This should be phrased as a direct command to the analysis AI." },
        positiveExample: { type: Type.STRING, description: "A creative, realistic example of a social media post that perfectly follows this rule." },
        negativeExample: { type: Type.STRING, description: "A creative, realistic example of a social media post that clearly violates this rule." }
    },
    required: ["description", "positiveExample", "negativeExample"]
};

// FIX: Add a schema for the Greenlight Brief feature.
const greenlightBriefSchema = {
    type: Type.OBJECT,
    properties: {
        campaignOverview: { type: Type.STRING, description: "A one-paragraph overview of the campaign's goal, tone, and feel, based on the provided inputs." },
        keyDos: { type: Type.ARRAY, description: "A bulleted list of 3-5 essential 'Do's' for creators, focusing on positive actions and brand voice.", items: { type: Type.STRING } },
        keyDonts: { type: Type.ARRAY, description: "A bulleted list of 3-5 critical 'Don'ts' for creators, highlighting common pitfalls, off-brand messaging, or specific words to avoid.", items: { type: Type.STRING } },
        disclosureGuide: { type: Type.STRING, description: "A concise, easy-to-understand paragraph explaining exactly how and where to place FTC disclosures like #ad, tailored to the campaign type." },
        compliantExample: { type: Type.STRING, description: "A creative, fully compliant example of a social media post that perfectly follows all the rules and guidelines in this brief." }
    },
    required: ["campaignOverview", "keyDos", "keyDonts", "disclosureGuide", "compliantExample"]
};

const generateCustomRulesPrompt = (customRules?: CustomRule[]): string => {
    if (!customRules || customRules.length === 0) return "";
    const rulesText = customRules.map((rule, index) => 
        `---
        **Custom Rule ${index + 1}: "${rule.intent}"**
        **Detailed Instruction:** ${rule.description}
        **Example of a post that PASSES this rule:** "${rule.positiveExample}"
        **Example of a post that FAILS this rule:** "${rule.negativeExample}"
        ---`
    ).join('\n\n');
    return `\n**Additional Custom Campaign Rules:**\nYou MUST strictly enforce the following custom rules. For each custom rule, create a separate check in the output JSON. The 'name' of this check MUST be "Custom Rule: " followed by the original user intent (e.g., "Custom Rule: Must be positive and upbeat"). Use the provided examples to understand the nuance of the rule.\n${rulesText}\n`;
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

const generateStrategicInsight = async (report: Omit<ComplianceReport, 'workspaceId'>): Promise<string> => {
    const failedChecks = report.checks.filter(c => c.status === 'fail' || c.status === 'warn');
    if (failedChecks.length === 0) return "";

    const issues = failedChecks.map(c => `- ${c.name}: ${c.details}`).join('\n');

    const prompt = `You are a "Strategic Insight Engine" for a marketing compliance tool. Your job is to provide a concise, actionable insight for a marketer based on a compliance report. Do not just repeat the errors. Explain the "why" from a marketing or business risk perspective. Keep it to one or two sentences.

    **Original Content:**
    "${report.sourceContent}"

    **Compliance Issues Found:**
    ${issues}

    Generate a single, helpful strategic insight based on these issues. For example: "Insight: While the message is engaging, the buried #ad poses a legal risk and can damage audience trust. The 'Magic Fix' revision places it upfront for maximum safety."`;

    try {
        const response = await generateContentWithRetry({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { thinkingConfig: { thinkingBudget: 0 } } // Low latency for this quick task
        });
        return response.text.trim();
    } catch (e) {
        console.error("Error generating strategic insight:", e);
        return ""; // Fail silently, as this is an enhancement not a core feature.
    }
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string | null> => {
    if (!ai) throw new Error("VITE_GEMINI_API_KEY is not configured.");

    try {
        const response = await generateContentWithRetry({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data; // Return the base64 of the new image
            }
        }
        return null; // Should not happen if Modality.IMAGE is requested
    } catch (e: any) {
        console.error("Error editing image:", e);
        if (e.message && e.message.toLowerCase().includes('safety')) {
            throw new Error("The request was blocked due to the content safety policy. Please modify your prompt and try again.");
        }
        if (e.message && e.message.includes('API key not valid')) {
            throw new Error("The configured API Key is invalid. Please check your configuration.");
        }
        throw new Error("An unexpected error occurred while editing the image. Check the console for details.");
    }
};

export const architectRule = async (intent: string): Promise<Omit<CustomRule, 'id' | 'intent'>> => {
    const fullPrompt = `You are a "Rules Architect" for an AI compliance system. Your job is to take a user's simple, natural language intent and convert it into a structured, detailed rule that an AI can understand and enforce. Provide a detailed description of the rule, a positive example of a post that follows it, and a negative example of a post that violates it.

    **User's Intent:**
    "${intent}"

    Return the result in the required JSON format. The examples must be creative and realistic social media posts.`;

    const response = await generateContentWithRetry({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: ruleArchitectSchema
        }
    });

    try {
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse JSON for rule architect:", response.text);
        throw new Error("The engine could not generate a rule from the provided intent. Please try rephrasing it.");
    }
};

// FIX: Add generateGreenlightBrief function to support the Brief Studio feature.
export const generateGreenlightBrief = async (
    inputs: { product: string; message: string; audience: string },
    customRules?: CustomRule[]
): Promise<GreenlightBrief> => {
    const fullPrompt = `You are an expert marketing strategist and compliance officer creating a "Greenlight Brief" for social media influencers. The brief must be clear, concise, and help creators produce effective, compliant content.

    **Campaign Inputs:**
    - **Product/Service:** ${inputs.product}
    - **Key Message:** ${inputs.message}
    - **Target Audience:** ${inputs.audience}

    **Standard Compliance Rules to Enforce:**
    1.  **FTC Disclosure:** All sponsored content must be clearly and conspicuously disclosed (e.g., #ad, #sponsored).
    2.  **Brand Safety:** No profanity, controversial topics, or disparagement of competitors.
    3.  **Claim Accuracy:** Any product claims must be truthful and not misleading. For this campaign, creators must mention "made with 100% organic materials".

    ${generateCustomRulesPrompt(customRules)}

    Based on all the information above, generate a complete Greenlight Brief in the required JSON format. The brief should be encouraging and empowering for the creator.`;

    const response = await generateContentWithRetry({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: greenlightBriefSchema
        }
    });

    try {
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse JSON for Greenlight Brief:", response.text);
        throw new Error("The engine could not generate a brief from the provided inputs. Please try rephrasing them.");
    }
};

// FIX: Added the generateImage function to enable image generation capabilities in the Image Studio.
// This function calls the Gemini API to generate an image from a text prompt.
export const generateImage = async (prompt: string): Promise<string[]> => {
    if (!ai) throw new Error("VITE_GEMINI_API_KEY is not configured.");

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });
    
        return response.generatedImages.map(img => img.image.imageBytes);
    } catch(e: any) {
        console.error("Error generating image:", e);
        if (e.message && e.message.toLowerCase().includes('safety')) {
            throw new Error("The request was blocked due to the content safety policy. Please modify your prompt and try again.");
       }
       if (e.message && e.message.includes('API key not valid')) {
            throw new Error("The configured API Key is invalid. Please check your configuration.");
        }
       throw new Error("An unexpected error occurred while generating the image. Check the console for details.");
    }
};

export const generateTestScenario = async (profilePrompt: string): Promise<{ postContent: string; expectedSummary: string; expectedScoreText: string; expectedToPass: boolean; }> => {
    const fullPrompt = `You are a "Red Team" agent responsible for testing an AI compliance system. Your goal is to generate creative and tricky test cases for social media posts.
    
    **Your Persona and Goal:**
    ${profilePrompt}

    **Standard Compliance Rules to Test Against:**
    1.  **FTC Disclosure:** Must contain a clear disclosure like #ad or #sponsored.
    2.  **Brand Safety:** No profanity or controversial topics.
    3.  **Claim Accuracy:** Must mention "made with 100% organic materials".

    Based on your persona, generate a single, unique social media post caption and predict its compliance outcome. Return the result in the required JSON format.`;

    const response = await generateContentWithRetry({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: testScenarioSchema
        }
    });

    try {
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse JSON for test scenario:", response.text);
        throw new Error("The test scenario generator returned an invalid response. Please try again.");
    }
};

export const transcribeVideo = async (videoFile: File): Promise<string> => {
    const videoData64 = await fileToBase64(videoFile);
    const prompt = "Provide a full and accurate transcript of the audio in the provided video file. Return only the transcribed text, with no additional commentary or formatting.";
    
    const response = await generateContentWithRetry({
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

async function processAnalysis<T extends Omit<ComplianceReport, 'workspaceId'>>(
    analysisFn: () => Promise<T>,
    onInsight: (insight: string) => void
): Promise<T> {
    const report = await analysisFn();

    if (report.overallScore < 90) {
        // Don't await this; let it run in the background
        generateStrategicInsight(report).then(onInsight);
    }
    
    return report;
}

export const analyzePostContent = (postContent: string, campaignName: string, customRules?: CustomRule[], isRescan = false, onInsight: (insight: string) => void = () => {}): Promise<Omit<ComplianceReport, 'workspaceId'>> => {
    if (!ai) return Promise.resolve(createErrorResponse("API Key Missing", "The VITE_GEMINI_API_KEY is not configured. Please add it to your environment variables."));

    const analysisFn = async () => {
        const userName = getUserName();
        const fullPrompt = `Act as an expert social media compliance officer for a major brand. Your task is to analyze the following sponsored post caption for compliance with FTC guidelines, brand safety, and specific campaign requirements.\n\n**Post Caption to Analyze:**\n"${postContent}"\n\n**Standard Compliance Rules:**\n1.  **FTC Disclosure:** The post MUST contain a clear and conspicuous disclosure, such as #ad, #sponsored, or "Paid partnership".\n2.  **Brand Safety:** The post must NOT contain any profanity, offensive language, or controversial topics.\n3.  **Claim Accuracy:** The post must accurately represent the product and mention "made with 100% organic materials".\n${generateCustomRulesPrompt(customRules)}\nPlease provide a strict analysis, recommend a status, and return the results in the required JSON format. If any compliance issues are found, you MUST provide a revised, compliant version of the text in the 'suggestedRevision' field. If it's fully compliant, return an empty string for 'suggestedRevision'.`;
        
        const config = { 
            responseMimeType: "application/json", 
            responseSchema: complianceSchema,
            ...(isRescan && { thinkingConfig: { thinkingBudget: 0 } }) 
        };
        
        const response = await generateContentWithRetry({ 
            model: "gemini-2.5-flash", 
            contents: fullPrompt, 
            config 
        });
        
        let partialReport;
        try {
            partialReport = JSON.parse(response.text);
        } catch (e) {
            console.error("Failed to parse JSON response from Gemini:", response.text);
            partialReport = {
                overallScore: 0,
                summary: "Error: The engine returned an invalid response. This may be due to content safety filters or an internal error. Please check your content or try again.",
                checks: [{
                    name: "Response Error",
                    status: "fail",
                    details: "Could not parse the JSON response from the engine. The raw response was logged to the console."
                }],
                recommendedStatus: 'revision',
                suggestedRevision: "We couldn't generate a revision due to an engine response error."
            };
        }
        return { ...partialReport, id: crypto.randomUUID(), timestamp: new Date().toISOString(), sourceContent: postContent, analysisType: 'text', customRulesApplied: customRules, userName, campaignName: campaignName || undefined };
    };

    return processAnalysis(analysisFn, onInsight);
};

export const analyzeImageContent = (caption: string, campaignName: string, imageFile: File, customRules?: CustomRule[], onInsight: (insight: string) => void = () => {}): Promise<Omit<ComplianceReport, 'workspaceId'>> => {
    if (!ai) return Promise.resolve(createErrorResponse("API Key Missing", "The VITE_GEMINI_API_KEY is not configured. Please add it to your environment variables."));
    
    const analysisFn = async () => {
        const userName = getUserName();
        const imageData64 = await fileToBase64(imageFile);
        const prompt = `Act as an expert social media compliance officer. Analyze the provided image and its caption for compliance. You must check BOTH the visual content and the text content.\n\n**Image Caption for Text Analysis:**\n"${caption}"\n\n**Standard Compliance Rules:**\n1.  **FTC Disclosure (Text):** The caption must contain a clear disclosure (e.g., #ad, #sponsored).\n2.  **Brand Safety (Visual & Text):** No profanity in text, no inappropriate imagery.\n3.  **Brand Representation (Visual):** The product must be clearly visible and not depicted negatively.\n${generateCustomRulesPrompt(customRules)}\nProvide a strict analysis covering both modalities ('visual' for image, 'text' for caption), recommend a status, and return the results in the required JSON format.`;

        const response = await generateContentWithRetry({
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
                summary: "Error: The engine returned an invalid response. This may be due to content safety filters or an internal error. Please check your content or try again.",
                checks: [{
                    name: "Response Error",
                    status: "fail",
                    details: "Could not parse the JSON response from the engine. The raw response was logged to the console."
                }],
                recommendedStatus: 'revision'
            };
        }
        return { ...partialReport, id: crypto.randomUUID(), timestamp: new Date().toISOString(), sourceContent: caption, analysisType: 'image', customRulesApplied: customRules, sourceMedia: { data: imageData64, mimeType: imageFile.type }, userName, campaignName: campaignName || undefined };
    };

    return processAnalysis(analysisFn, onInsight);
};

export const analyzeVideoContent = (videoTranscript: string, campaignName: string, videoFile: File, customRules?: CustomRule[], onInsight: (insight: string) => void = () => {}): Promise<Omit<ComplianceReport, 'workspaceId'>> => {
    if (!ai) return Promise.resolve(createErrorResponse("API Key Missing", "The VITE_GEMINI_API_KEY is not configured. Please add it to your environment variables."));
    
    const analysisFn = async () => {
        const userName = getUserName();
        const videoData64 = await fileToBase64(videoFile);
        const actualFullPrompt = `Act as an expert social media compliance officer. Analyze the provided video and its transcript for compliance with FTC guidelines, brand safety, and custom campaign requirements. You must perform checks on BOTH the visual content of the video and the audio content from the transcript.\n\n**Video Transcript for Audio Analysis:**\n"${videoTranscript}"\n\n**Standard Compliance Rules (Check both Audio & Visuals):**\n1.  **FTC Disclosure:** Audio must contain a spoken disclosure, and visuals should have a text overlay.\n2.  **Brand Safety:** No profanity in audio, no inappropriate imagery in visuals.\n3.  **Brand Representation:** Speaker must mention "made with 100% organic materials", product must be clearly visible.\n${generateCustomRulesPrompt(customRules)}\nProvide a strict analysis covering both modalities, recommend a status, and return the results in the required JSON format. For each check, specify the modality as 'audio' or 'visual'.`;

        const response = await generateContentWithRetry({ model: "gemini-2.5-flash", contents: { parts: [{ text: actualFullPrompt }, { inlineData: { mimeType: videoFile.type, data: videoData64 } }] }, config: { responseMimeType: "application/json", responseSchema: multimodalComplianceSchema }});
        let partialReport;
        try {
            partialReport = JSON.parse(response.text);
        } catch (e) {
            console.error("Failed to parse JSON response from Gemini:", response.text);
            partialReport = {
                overallScore: 0,
                summary: "Error: The engine returned an invalid response. This may be due to content safety filters or an internal error. Please check your content or try again.",
                checks: [{
                    name: "Response Error",
                    status: "fail",
                    details: "Could not parse the JSON response from the engine. The raw response was logged to the console."
                }],
                recommendedStatus: 'revision'
            };
        }
        return { ...partialReport, id: crypto.randomUUID(), timestamp: new Date().toISOString(), sourceContent: videoTranscript, analysisType: 'video', customRulesApplied: customRules, sourceMedia: { data: videoData64, mimeType: videoFile.type }, userName, campaignName: campaignName || undefined };
    };
    
    return processAnalysis(analysisFn, onInsight);
};