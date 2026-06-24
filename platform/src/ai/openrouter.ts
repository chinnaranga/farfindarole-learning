import OpenAI from "openai";

const apiKey = process.env.OPENROUTER_API_KEY;
const openai = apiKey ? new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: apiKey,
}) : null;

export async function generateOpenRouter(prompt: string, model: string = "google/gemini-2.5-pro"): Promise<string> {
  if (!openai) {
    return "";
  }
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenRouter API error:", error);
    return "";
  }
}
