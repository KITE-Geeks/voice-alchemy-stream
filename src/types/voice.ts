// Voice-related types for ElevenLabs API

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  preview_url: string;
}

export interface TextToSpeechResponse {
  audio: string; // Base64 encoded audio
}

export interface SpeechToSpeechResponse {
  audio: string; // Base64 encoded audio
}

export interface SoundFXVariation {
  audio: ArrayBuffer;
  mimeType: string;
}

export interface SoundFXResponse {
  variations: SoundFXVariation[];
}

// Sound effects generation parameters
export interface SoundFXParams {
  text: string;
  model_id?: string;
  output_format?: string;
  num_variations?: number;
  duration_seconds?: number;
  prompt_influence?: number;
}

// Music generation parameters
export interface MusicParams {
  prompt?: string;
  duration_seconds?: number;
  model_id?: string;
  lyrics?: string;
  instrumental?: boolean;
  force_instrumental?: boolean;
  composition_plan?: {
    positive_global_styles: string[];
    negative_global_styles: string[];
    sections: Array<{
      section_name: string;
      positive_local_styles: string[];
      negative_local_styles: string[];
      duration_ms: number;
      type: 'vocal' | 'instrumental';
      prompt: string;
      lyrics?: string;
      lines?: string[];
    }>;
  };
}

export interface MusicResponse {
  audio: ArrayBuffer;
  mimeType: string;
}

// Voice isolator response
export interface VoiceIsolatorResponse {
  audio: ArrayBuffer;
  mimeType: string;
}
