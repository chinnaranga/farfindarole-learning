export async function generateClaude(prompt: string, model: string = "claude-3-5-sonnet-20241022"): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "";
  }
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.content?.[0]?.text || "";
  } catch (error) {
    console.error("Claude API error:", error);
    return "";
  }
}
