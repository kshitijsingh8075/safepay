/**
 * OCR Service
 * Uses OpenAI's vision capabilities to extract text from images
 */

import openai from "./openai";

/**
 * Extract text from an image using OpenAI's vision model
 * @param imageBase64 Base64 encoded image
 * @returns Extracted text from the image
 */
export async function extractTextFromImage(imageBase64: string): Promise<string> {
  try {
    // Use OpenAI to extract text from image
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Use the latest model with vision capabilities
      messages: [
        {
          role: "system",
          content: "You are a specialized OCR tool. Extract all visible text from the provided image. Return only the text content, no additional comments."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all visible text from this image. Include only the raw text with no additional commentary or introduction. Preserve the layout and line breaks as closely as possible."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ]
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("OpenAI OCR error:", error);
    return "";
  }
}

export default {
  extractTextFromImage
};