import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function generateOpenAI(prompt: string, model: string = "gpt-4o"): Promise<string> {
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
    console.error("OpenAI API error:", error);
    return "";
  }
}
