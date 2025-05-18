import axios from 'axios';

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  preview_url: string;
}

interface VoicesResponse {
  voices: Voice[];
}

export interface TextToSpeechResponse {
  audio: string; // Base64 encoded audio
}

export interface SpeechToSpeechResponse {
  audio: string; // Base64 encoded audio
}

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Cost calculation based on ElevenLabs pricing
export const calculateTextToSpeechCost = (text: string): number => {
  // ElevenLabs charges per character
  const charactersPerCredit = 1; // Based on their pricing
  return Math.ceil((text.length / charactersPerCredit) * 100) / 100; // Round up to 2 decimal places
};

export const elevenlabsApi = {
  async getVoices(apiKey: string): Promise<Voice[]> {
    const response = await axios.get<VoicesResponse>(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });
    return response.data.voices;
  },

  async convertTextToSpeech(
    apiKey: string,
    voiceId: string,
    text: string,
    stability: number = 0.5,
    similarityBoost: number = 0.75
  ): Promise<TextToSpeechResponse> {
    const response = await axios.post<ArrayBuffer>(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        text,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    // Convert the arraybuffer to base64
    const base64Audio = btoa(
      new Uint8Array(response.data)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    return { audio: base64Audio };
  },

  async convertSpeechToSpeech(
    apiKey: string,
    voiceId: string,
    audioFile: File,
    stability: number = 0.5,
    similarityBoost: number = 0.75
  ): Promise<SpeechToSpeechResponse> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('voice_id', voiceId);
    formData.append('stability', stability.toString());
    formData.append('similarity_boost', similarityBoost.toString());

    const response = await axios.post<ArrayBuffer>(
      `${ELEVENLABS_API_URL}/speech-to-speech/${voiceId}`,
      formData,
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'arraybuffer',
      }
    );

    // Convert the arraybuffer to base64
    const base64Audio = btoa(
      new Uint8Array(response.data)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    return { audio: base64Audio };
  },
}; 