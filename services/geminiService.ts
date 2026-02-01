import { GoogleGenAI } from "@google/genai";

export const editImageWithGemini = async (
  base64Image: string, 
  prompt: string
): Promise<string> => {
  // Always use the direct initialization as per @google/genai guidelines.
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
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

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("The AI model returned no results. Try a clearer photo.");
    }

    const parts = response.candidates[0].content.parts;
    
    // Iterate through all parts to find the image part, as recommended by guidelines.
    for (const part of parts) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64EncodeString}`;
      }
    }

    // Fallback if no image part found
    const textPart = parts.find(p => p.text);
    if (textPart) {
      throw new Error(textPart.text);
    }

    throw new Error("No image was generated. Please try a different request.");
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    
    // Graceful error handling for API issues
    if (error.message?.includes('API key')) {
      throw new Error("Invalid API Key configuration. Please check the server environment.");
    }
    
    throw new Error(error.message || "Something went wrong with the AI processing.");
  }
};