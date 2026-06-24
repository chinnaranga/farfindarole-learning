import OpenAI from "openai";

const apiKey = process.env.DEEPSEEK_API_KEY;
const openai = apiKey ? new OpenAI({
  baseURL: "https://api.deepseek.com/v1",
  apiKey: apiKey,
}) : null;

export async function generateDeepSeek(prompt: string, model: string = "deepseek-chat"): Promise<string> {
  if (!openai) {
    const orKey = process.env.OPENROUTER_API_KEY;
    if (orKey) {
      try {
        const orClient = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: orKey,
        });
        const response = await orClient.chat.completions.create({
          model: "deepseek/deepseek-chat",
          messages: [{ role: "user", content: prompt }],
        });
        return response.choices[0]?.message?.content || "";
      } catch (e) {
        console.error("DeepSeek via OpenRouter error:", e);
      }
    }
    return "";
  }
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("DeepSeek API error:", error);
    return "";
  }
}
