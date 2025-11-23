import { GoogleGenAI, Type } from "@google/genai";
import { StudioState, CharacterDNA } from "../types";

const getAIClient = (userApiKey?: string) => {
  // Prioritize user provided key, then fallback to env
  const apiKey = userApiKey || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Ensure process.env.API_KEY is available or enter a custom key.");
  }
  return new GoogleGenAI({ apiKey });
};

// Helper to extract base64 data and mime type
const parseBase64 = (base64String: string) => {
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 string");
  }
  return {
    mimeType: matches[1],
    data: matches[2]
  };
};

export const describeImage = async (
  base64Image: string, 
  type: 'general' | 'character_only' = 'general',
  apiKey?: string
): Promise<Partial<CharacterDNA>> => {
  const ai = getAIClient(apiKey);
  const { mimeType, data } = parseBase64(base64Image);

  let promptText = "Analise esta imagem e extraia descrições detalhadas para os seguintes campos em Português: base_description (resumo geral), face, eyes, clothes, body, setting, visual_style.";

  if (type === 'character_only') {
    promptText = "Analise SOMENTE O PERSONAGEM (ou personagens) nesta imagem. Ignore o fundo/cenário. Extraia descrições para: base_description (quem é), face, eyes, clothes, body. Deixe 'setting' e 'visual_style' vazios ou nulos.";
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', 
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: data
          }
        },
        {
          text: promptText
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          base_description: { type: Type.STRING },
          face: { type: Type.STRING },
          eyes: { type: Type.STRING },
          clothes: { type: Type.STRING },
          body: { type: Type.STRING },
          setting: { type: Type.STRING },
          visual_style: { type: Type.STRING }
        }
      }
    }
  });

  try {
    const text = response.text;
    return text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("Failed to parse JSON from image description", e);
    return {};
  }
};

// New function to translate state to English for AI consumption
export const translateStateForOutput = async (state: StudioState, apiKey?: string): Promise<StudioState> => {
  const ai = getAIClient(apiKey);
  
  // If everything is empty, return state as is to save API calls
  if (!state.character_dna.base_description && !state.scene.action) return state;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [{
        text: `Translate the following Portuguese descriptions into English optimized for AI Image Generation Prompts.
        Fields to translate: base_description, face, eyes, clothes, body, setting, visual_style, and action.
        Do NOT translate fields: dialogue1, dialogue2, dialogue3.
        
        Input Data:
        ${JSON.stringify({
          base_description: state.character_dna.base_description,
          face: state.character_dna.face,
          eyes: state.character_dna.eyes,
          clothes: state.character_dna.clothes,
          body: state.character_dna.body,
          setting: state.character_dna.setting,
          visual_style: state.character_dna.visual_style,
          action: state.scene.action
        })}
        `
      }]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
         type: Type.OBJECT,
         properties: {
            base_description: { type: Type.STRING },
            face: { type: Type.STRING },
            eyes: { type: Type.STRING },
            clothes: { type: Type.STRING },
            body: { type: Type.STRING },
            setting: { type: Type.STRING },
            visual_style: { type: Type.STRING },
            action: { type: Type.STRING }
         }
      }
    }
  });
  
  try {
    const translated = JSON.parse(response.text || "{}");
    
    return {
      ...state,
      character_dna: {
        ...state.character_dna,
        base_description: translated.base_description || state.character_dna.base_description,
        face: translated.face || state.character_dna.face,
        eyes: translated.eyes || state.character_dna.eyes,
        clothes: translated.clothes || state.character_dna.clothes,
        body: translated.body || state.character_dna.body,
        setting: translated.setting || state.character_dna.setting,
        visual_style: translated.visual_style || state.character_dna.visual_style,
      },
      scene: {
        ...state.scene,
        action: translated.action || state.scene.action
      }
    };
  } catch (e) {
    console.error("Translation failed", e);
    return state;
  }
};

export const generateStudioImage = async (
  prompt: string, 
  aspectRatio: "1:1" | "16:9" | "9:16",
  referenceImage?: string | null,
  characterReferenceImage?: string | null,
  apiKey?: string
): Promise<string> => {
  const ai = getAIClient(apiKey);
  
  const parts: any[] = [];
  
  // Add Setting/Visual Reference
  if (referenceImage) {
    const { mimeType, data } = parseBase64(referenceImage);
    parts.push({
      inlineData: { mimeType, data }
    });
  }

  // Add Character Reference (if exists)
  if (characterReferenceImage) {
    const { mimeType, data } = parseBase64(characterReferenceImage);
    parts.push({
      inlineData: { mimeType, data }
    });
  }
  
  // Add the text prompt
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: parts,
    },
    config: {
       imageConfig: {
         aspectRatio: aspectRatio
       }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      return `data:image/png;base64,${base64EncodeString}`;
    }
  }
  throw new Error("No image data found in response");
};

export const constructJSONOutput = (
  state: StudioState, 
  type: 'image' | 'video'
): any => {
  const { scene } = state;
  const dna = state.character_dna;

  const basePrompt = [
    dna.base_description,
    dna.face,
    dna.eyes,
    dna.clothes,
    dna.body,
    dna.setting,
    dna.visual_style
  ].filter(Boolean).join(' ');

  const fullPrompt = `${basePrompt} -- ACTION: ${scene.action}`;

  return {
    scene_id: 0, 
    character_dna: dna,
    scene_data: {
      action: scene.action,
      dialogue_1: type === 'video' ? (scene.dialogue1 || null) : null,
      dialogue_2: type === 'video' ? (scene.dialogue2 || null) : null,
      dialogue_3: type === 'video' ? (scene.dialogue3 || null) : null
    },
    final_prompt_for_ai: fullPrompt
  };
};