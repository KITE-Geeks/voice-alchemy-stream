
// Service class to handle ElevenLabs API calls
export class ElevenLabsAPI {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  // Validates the API key by fetching voices instead of user info
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Invalid API key');
      }
      
      return true;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }
  
  // Gets available voices from ElevenLabs
  async getVoices() {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch voices');
      }
      
      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Get voices error:', error);
      throw error;
    }
  }
  
  // Converts audio using Voice Conversion API
  async convertAudio(sourceAudioFile: File, targetVoiceId: string): Promise<Blob> {
    try {
      const formData = new FormData();
      formData.append('audio', sourceAudioFile);
      formData.append('voice_id', targetVoiceId);
      formData.append('model_id', 'eleven_multilingual_sts_v2');
      
      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-speech', {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to convert audio');
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Audio conversion error:', error);
      throw error;
    }
  }
}
