import OpenAI from "openai";

const apiKey = process.env.QWEN_API_KEY;
const openai = apiKey ? new OpenAI({
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  apiKey: apiKey,
}) : null;

export async function generateQwen(prompt: string, model: string = "qwen-max"): Promise<string> {
  if (!openai) {
    const orKey = process.env.OPENROUTER_API_KEY;
    if (orKey) {
      try {
        const orClient = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: orKey,
        });
        const response = await orClient.chat.completions.create({
          model: "qwen/qwen-2.5-72b-instruct",
          messages: [{ role: "user", content: prompt }],
        });
        return response.choices[0]?.message?.content || "";
      } catch (e) {
        console.error("Qwen via OpenRouter error:", e);
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
    console.error("Qwen API error:", error);
    return "";
  }
}
