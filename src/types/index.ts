
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category?: string;
}

export interface ConversionState {
  isApiKeyValid: boolean;
  isUploading: boolean;
  isConverting: boolean;
  isPlaying: boolean;
  sourceAudio: File | null;
  sourceAudioUrl: string | null;
  convertedAudioUrl: string | null;
  selectedVoiceId: string | null;
  error: string | null;
}
