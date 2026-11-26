
import { GoogleGenAI, Type } from "@google/genai";
import { getHumanizePrompt, AI_DETECTION_PROMPT } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface AIDetectionResult {
    probability: number;
    indicators: { name: string; level: 'low' | 'medium' | 'high'; description: string }[];
}

export async function humanizeText(text: string, mode: string, context: string): Promise<string> {
  if (!text.trim()) {
    return "";
  }
  
  const systemInstruction = getHumanizePrompt(mode, context);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
        topP: 0.95,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for humanization:", error);
    if (error instanceof Error) {
        return `Erro ao humanizar o texto: ${error.message}`;
    }
    return "Ocorreu um erro desconhecido ao processar sua solicitação.";
  }
}

export async function detectAIText(text: string): Promise<AIDetectionResult | null> {
    if (!text.trim()) {
        return null;
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${AI_DETECTION_PROMPT}\n\nTexto para análise: "${text}"`,
            config: {
                responseMimeType: "application/json",
                // FIX: Add responseSchema for robust JSON output.
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        probability: {
                            type: Type.NUMBER,
                            description: "A number from 0 to 100 representing the percentage probability of being AI-generated."
                        },
                        indicators: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    level: { type: Type.STRING, description: "Can be 'low', 'medium', or 'high'." },
                                    description: { type: Type.STRING },
                                },
                                required: ['name', 'level', 'description'],
                            },
                        },
                    },
                    required: ['probability', 'indicators'],
                }
            },
        });
        
        const jsonText = response.text.trim();
        // Sometimes the model might wrap the JSON in markdown backticks
        const cleanedJson = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        const result: AIDetectionResult = JSON.parse(cleanedJson);
        return result;

    } catch (error) {
        console.error("Error calling Gemini API for AI detection:", error);
        return null;
    }
}
