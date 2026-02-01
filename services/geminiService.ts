
import { GoogleGenAI } from "@google/genai";

export const editImageWithGemini = async (
  base64Image: string, 
  prompt: string
): Promise<string> => {
  // Always initialize fresh to ensure correct API key handling
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Use gemini-2.5-flash-image for visual editing tasks
  const modelName = 'gemini-2.5-flash-image';
  
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
      throw new Error("No output generated from AI.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image data found in the AI response.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Provide a more descriptive error if the API key is missing
    if (error.message?.includes('API_KEY')) {
      throw new Error("API Key is missing or invalid. Please check your environment variables.");
    }
    throw error;
  }
};
