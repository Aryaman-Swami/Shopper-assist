import { Type } from "@google/genai";
import { getClient } from "./geminiClient.js";

export const EXTRACTION_MODEL = "gemini-3.6-flash";

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          qty: { type: Type.NUMBER },
          unit: { type: Type.STRING },
        },
        required: ["name", "qty"],
      },
    },
  },
  required: ["items"],
};

const PROMPT =
  "Extract a structured shopping list from the input. Return each distinct " +
  "item with a name, quantity (default 1 if unspecified), and unit if given " +
  "(e.g. 'dozen', 'kg', 'pack'). Normalize misspellings and abbreviations to " +
  "plain product names.";

export async function extractFromText(text) {
  const client = getClient();
  const response = await client.models.generateContent({
    model: EXTRACTION_MODEL,
    contents: `${PROMPT}\n\nShopping list:\n${text}`,
    config: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
  });
  return JSON.parse(response.text).items;
}

export async function extractFromImage(imageBuffer, mimeType) {
  const client = getClient();
  const response = await client.models.generateContent({
    model: EXTRACTION_MODEL,
    contents: [
      { inlineData: { data: imageBuffer.toString("base64"), mimeType } },
      PROMPT,
    ],
    config: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
  });
  return JSON.parse(response.text).items;
}
