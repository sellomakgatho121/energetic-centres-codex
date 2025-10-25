import { GoogleGenAI, Type, Modality, Chat, Blob } from "@google/genai";
import { EnergyCenterContent } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- AUDIO UTILS ---
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}


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
        },
        practicalApplication: { type: Type.STRING, description: "A brief, actionable exercise, meditation, or affirmation related to this topic. Start with a clear heading like 'Meditation:' or 'Affirmation:'." },
        suggestedImagePrompt: { type: Type.STRING, description: "A rich, symbolic, and artistic prompt for an image generation model, focusing on abstract and ethereal concepts. Do not include technical instructions like 'high resolution' or 'no text'."}
    },
    required: ["title", "sanskritName", "location", "color", "element", "purpose", "balancedState", "unbalancedState", "relatedConcepts", "practicalApplication", "suggestedImagePrompt"]
};

export const generateContentForTopic = async (topicName: string): Promise<EnergyCenterContent> => {
    const prompt = `Act as a world-class spiritual codex author. Your knowledge is sourced exclusively and comprehensively from the content of ascensionglossary.com and energeticsynthesis.com. This includes all text and a full catalog of all descriptive images and diagrams on those sites. You must synthesize this multi-modal information. Provide a detailed and thorough knowledge codex entry for '${topicName}'. Your tone should be wise, clear, and informative. Integrate knowledge derived from visual information (charts, diagrams, symbols) contextually within your textual descriptions. Fill out all fields in the provided JSON schema with detailed and accurate information based on this complete knowledge base.`;

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
    const basePrompt = content.suggestedImagePrompt || `An abstract, artistic, symbolic representation of the "${content.title} (${content.sanskritName})". The dominant color should be ${content.color}. The image should evoke the essence of its element, "${content.element}", and its purpose.`;
    const fullPrompt = `${basePrompt} Ethereal, mystical, vibrant, and energetic. High resolution, visually stunning, no text or words on the image.`;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
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
        return null;
    }
};

export const generateSpeechForText = async (text: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Read this passage with a calm and wise tone: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};

export const generateVideoFromImage = async (
    prompt: string,
    imageData: string,
    mimeType: string,
    aspectRatio: '16:9' | '9:16',
    onProgress: (message: string) => void
) => {
    onProgress("Initializing video generation...");
    // A new instance must be used here to get the latest API key from the dialog
    const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await videoAI.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
            imageBytes: imageData,
            mimeType: mimeType,
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    });

    onProgress("Video weaving in progress... This may take several minutes.");
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        onProgress("Checking on the celestial loom...");
        operation = await videoAI.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed but no download link was found.");
    }
    
    onProgress("Fetching generated video...");
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};


export const createChat = (useThinkingMode: boolean): Chat => {
    const model = useThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash-lite';
    const config: any = {
        systemInstruction: "You are a wise and insightful guide. Your entire knowledge base is built exclusively and comprehensively from the content of ascensionglossary.com and energeticsynthesis.com, including a full catalog and contextual understanding of all descriptive images and diagrams. Answer questions with clarity, depth, and a helpful tone, consistent with the 15-chakra system and other metaphysical concepts presented on those sites. Synthesize information from both text and visual sources in your explanations."
    };
    if (useThinkingMode) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }
    return ai.chats.create({ model, config });
};