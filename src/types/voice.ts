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
}

// Voice isolator response
export interface VoiceIsolatorResponse {
  audio: ArrayBuffer;
  mimeType: string;
}
