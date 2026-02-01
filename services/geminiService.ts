import { GoogleGenAI } from "@google/genai";

export const editImageWithGemini = async (
  base64Image: string, 
  prompt: string
): Promise<string> => {
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Using gemini-2.5-flash-image for high-quality image editing tasks as per instructions.
  const modelName = 'gemini-2.5-flash-image';
  
  // Extract clean base64 data and mime type
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
      throw new Error("AI engine could not process this image. Please try another one.");
    }

    const parts = response.candidates[0].content.parts;
    
    // Iterate through all parts to find the image part, as recommended.
    for (const part of parts) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
      }
    }

    // Handle cases where the model might return text explanation instead of an image
    const textPart = parts.find(p => p.text);
    if (textPart) {
      throw new Error(`AI Note: ${textPart.text}`);
    }

    throw new Error("Unexpected response from AI. No image data found.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Check specifically for empty API key error from the SDK
    if (error.message?.includes('API key') || !process.env.API_KEY) {
      throw new Error("API Key Configuration Error: Please check your Netlify environment variables.");
    }
    
    throw new Error(error.message || "Failed to edit image. Try a clearer portrait.");
  }
};