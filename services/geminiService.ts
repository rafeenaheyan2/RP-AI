import { GoogleGenAI } from "@google/genai";

export const editImageWithGemini = async (
  base64Image: string, 
  prompt: string
): Promise<string> => {
  // Try to get API key from process.env (Netlify/Vite define)
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please set it in Netlify environment variables as API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash-image';
  
  // Extract clean base64 data
  const mimeType = base64Image.split(';')[0].split(':')[1];
  const imageData = base64Image.split(',')[1];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              data: imageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error("The AI model returned an empty response. Please try again with a different photo.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    // If text is returned instead of image, it might be an error message from the model
    const textPart = candidate.content.parts.find(p => p.text);
    if (textPart) {
      throw new Error(`AI Notice: ${textPart.text}`);
    }

    throw new Error("No image data found in the AI response.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.status === 403 || error.status === 401) {
      throw new Error("API Key is invalid or has expired.");
    }
    if (error.status === 429) {
      throw new Error("Too many requests. Please wait a minute.");
    }
    throw error;
  }
};