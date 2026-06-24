import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function generateGemini(prompt: string, model: string = "gemini-2.5-flash"): Promise<string> {
  if (!ai) {
    return "";
  }
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return "";
  }
}
