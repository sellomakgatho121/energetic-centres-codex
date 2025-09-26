
import { GoogleGenAI, Type } from "@google/genai";
import { EnergyCenterContent } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The common name of the energy center, e.g., 'Root Chakra'." },
        sanskritName: { type: Type.STRING, description: "The Sanskrit name, e.g., 'Muladhara', or 'N/A' if not applicable." },
        location: { type: Type.STRING, description: "A brief description of its location in or around the physical body." },
        color: { type: Type.STRING, description: "The primary color(s) associated with this center." },
        element: { type: Type.STRING, description: "The classical or esoteric element associated with it, e.g., 'Earth'." },
        purpose: { type: Type.STRING, description: "A detailed paragraph about its primary spiritual and energetic purpose and function." },
        balancedState: { type: Type.STRING, description: "Description of the signs, feelings, and attributes when this center is balanced and healthy." },
        unbalancedState: { type: Type.STRING, description: "Description of the common signs, feelings, and blockages when this center is imbalanced." },
        relatedConcepts: {
            type: Type.ARRAY,
            description: "A list of 5 to 7 key esoteric or spiritual concepts directly related to this energy center.",
            items: { type: Type.STRING }
        }
    },
    required: ["title", "sanskritName", "location", "color", "element", "purpose", "balancedState", "unbalancedState", "relatedConcepts"]
};

export const generateContentForTopic = async (topicName: string): Promise<EnergyCenterContent> => {
    const prompt = `Act as a world-class spiritual codex author with deep knowledge of esoteric concepts, chakras, and metaphysics from the 'Ascension Glossary'. Provide a comprehensive and thorough knowledge codex entry for the energy center known as '${topicName}'. Your tone should be wise, clear, and informative. Fill out all fields in the provided JSON schema with detailed and accurate information.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.5,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);

        // Basic validation
        if (!parsedJson.title || !parsedJson.purpose) {
            throw new Error("Received incomplete data from API.");
        }

        return parsedJson as EnergyCenterContent;

    } catch (error) {
        console.error("Error fetching or parsing Gemini response:", error);
        throw new Error(`Failed to generate content for ${topicName}.`);
    }
};

export const generateImageForTopic = async (content: EnergyCenterContent): Promise<string | null> => {
    const prompt = `An abstract, artistic, symbolic representation of the "${content.title} (${content.sanskritName})". The dominant color should be ${content.color}. The image should evoke the essence of its element, "${content.element}", and its purpose. Ethereal, mystical, vibrant, and energetic. High resolution, visually stunning, no text or words on the image.`;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        return null; // Gracefully fail
    }
};
