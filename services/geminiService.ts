import { GoogleGenAI } from "@google/genai";

export const editImageWithGemini = async (
  base64Image: string, 
  prompt: string
): Promise<string> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey === '') {
    throw new Error("Gemini API Key is missing. Please set it in Netlify environment variables as API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });
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

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("AI engine could not process this image.");
    }

    const parts = response.candidates[0].content.parts;
    
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    const textPart = parts.find(p => p.text);
    if (textPart) {
      throw new Error(textPart.text);
    }

    throw new Error("No image data found in AI response.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to edit image. Check your API key and connection.");
  }
};