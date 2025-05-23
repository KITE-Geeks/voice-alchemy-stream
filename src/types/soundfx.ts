export interface SoundFXSettings {
  duration: number;
  promptAdherence: number;
  variationCount: number;
}

export interface GeneratedSound {
  id: string;
  audio: string; // base64 encoded audio
  prompt: string;
  timestamp: number;
}
