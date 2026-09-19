import { GoogleGenAI } from "@google/genai";
import { GeminiNotConfigured } from "../errors.js";

let client = null;

export function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new GeminiNotConfigured(
        "GEMINI_API_KEY is not set. Add it to your .env file " +
          "(get one at https://aistudio.google.com/apikey)."
      );
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}
