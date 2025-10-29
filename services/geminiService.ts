
import { GoogleGenAI, Modality } from "@google/genai";
import { ImageStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

export const generateImages = async (
  prompt: string,
  numberOfImages: number,
  style: ImageStyle
): Promise<string[]> => {
  const fullPrompt = `${prompt}, in a ${style.toLowerCase()} style.`;
  
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: numberOfImages,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });

    return response.generatedImages.map(img => img.image.imageBytes);
  } catch (error) {
    console.error("Error generating images:", error);
    throw new Error("Failed to generate images. Please check your prompt and API key.");
  }
};

export const editImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string,
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data found in the edit response.");

  } catch (error) {
    console.error("Error editing image:", error);
    throw new Error("Failed to edit the image. The model may not support this type of edit.");
  }
};
