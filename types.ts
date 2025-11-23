
export interface CharacterDNA {
  base_description: string;
  face: string;
  eyes: string;
  clothes: string;
  body: string;
  setting: string;
  visual_style: string;
}

export interface SceneData {
  action: string;
  dialogue1: string;
  dialogue2: string;
  dialogue3: string;
}

// The output format requested by the user
export interface JSONOutput {
  scene_id: number;
  character_dna: CharacterDNA;
  scene_data: {
    action: string;
    dialogue_1: string | null;
    dialogue_2: string | null;
    dialogue_3: string | null;
  };
  final_prompt_for_ai: string;
}

export interface StudioState {
  scene: SceneData;
  character_dna: CharacterDNA;
  referenceImage: string | null; // Visual Elements/Setting Reference
  characterReferenceImage: string | null; // Specific Character Reference
  lastGeneratedOutput: JSONOutput | null;
}

export const INITIAL_STATE: StudioState = {
  scene: {
    action: "",
    dialogue1: "",
    dialogue2: "",
    dialogue3: ""
  },
  character_dna: {
    base_description: "",
    face: "",
    eyes: "",
    clothes: "",
    body: "",
    setting: "",
    visual_style: ""
  },
  referenceImage: null,
  characterReferenceImage: null,
  lastGeneratedOutput: null
};
