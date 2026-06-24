import { generateGemini } from "./gemini";
import { generateDeepSeek } from "./deepseek";
import { generateOpenAI } from "./openai";
import { generateClaude } from "./claude";
import { generateOpenRouter } from "./openrouter";

export async function generate(type: string, prompt: string, selectedModel?: string): Promise<string> {
  // If a specific model is explicitly requested, try it first
  if (selectedModel) {
    let result = "";
    switch (selectedModel) {
      case "gemini":
      case "gemini-2.5-flash":
        result = await generateGemini(prompt, "gemini-2.5-flash");
        break;
      case "openai":
      case "gpt4":
      case "gpt-4o":
        result = await generateOpenAI(prompt, "gpt-4o");
        break;
      case "claude":
      case "claude-3-5-sonnet-20241022":
        result = await generateClaude(prompt, "claude-3-5-sonnet-20241022");
        break;
      case "openrouter":
      case "google/gemini-2.5-pro":
        result = await generateOpenRouter(prompt, "google/gemini-2.5-pro");
        break;
      case "deepseek":
      case "deepseek-chat":
        result = await generateDeepSeek(prompt, "deepseek-chat");
        break;
      default:
        break;
    }
    if (result) return result;
  }

  // Use the type parameter to determine which service to use
  switch (type) {
    case "gemini":
      if (process.env.GEMINI_API_KEY) {
        const res = await generateGemini(prompt, "gemini-2.5-flash");
        if (res) return res;
      }
      break;
    case "openai":
    case "gpt4":
      if (process.env.OPENAI_API_KEY) {
        const res = await generateOpenAI(prompt, "gpt-4o");
        if (res) return res;
      }
      break;
    case "claude":
      if (process.env.ANTHROPIC_API_KEY) {
        const res = await generateClaude(prompt, "claude-3-5-sonnet-20241022");
        if (res) return res;
      }
      break;
    case "openrouter":
      if (process.env.OPENROUTER_API_KEY) {
        const res = await generateOpenRouter(prompt, "google/gemini-2.5-pro");
        if (res) return res;
      }
      break;
    case "deepseek":
      if (process.env.DEEPSEEK_API_KEY) {
        const res = await generateDeepSeek(prompt, "deepseek-chat");
        if (res) return res;
      }
      break;
    default:
      // If type is not recognized, fall back to checking available keys in order of preference
      if (process.env.GEMINI_API_KEY) {
        const res = await generateGemini(prompt, "gemini-2.5-flash");
        if (res) return res;
      }
      if (process.env.OPENAI_API_KEY) {
        const res = await generateOpenAI(prompt, "gpt-4o");
        if (res) return res;
      }
      if (process.env.OPENROUTER_API_KEY) {
        const res = await generateOpenRouter(prompt, "google/gemini-2.5-pro");
        if (res) return res;
      }
      if (process.env.ANTHROPIC_API_KEY) {
        const res = await generateClaude(prompt, "claude-3-5-sonnet-20241022");
        if (res) return res;
      }
      if (process.env.DEEPSEEK_API_KEY) {
        const res = await generateDeepSeek(prompt, "deepseek-chat");
        if (res) return res;
      }
      break;
  }

  // If absolutely no key is configured, return an empty string to allow client-side handling
  return "";
}
