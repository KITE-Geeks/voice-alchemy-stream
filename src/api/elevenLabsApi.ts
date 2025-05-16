
// Service class to handle ElevenLabs API calls
export class ElevenLabsAPI {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  // Validates the API key by attempting to fetch voices
  async validateApiKey(): Promise<boolean> {
    try {
      // Try to fetch voices as a validation method
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'xi-api-key': this.apiKey
        }
      });
      
      // If we get a 401 or 403, the key is definitely invalid
      if (response.status === 401 || response.status === 403) {
        console.log('API key validation failed with status:', response.status);
        return false;
      }
      
      // Any other response means the key is probably valid
      // Even if we get a different error, it suggests the API recognized the key
      return true;
    } catch (error) {
      console.error('API key validation error (network failure):', error);
      // Network errors should not necessarily invalidate the key
      // The user might just have connectivity issues
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
        const errorData = await response.json().catch(() => ({}));
        console.error('Get voices error response:', errorData);
        throw new Error(errorData?.detail?.message || 'Failed to fetch voices');
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
      // Log the parameters for debugging
      console.log('Converting audio with targetVoiceId:', targetVoiceId);
      console.log('Audio file type:', sourceAudioFile.type, 'size:', sourceAudioFile.size);
      
      const formData = new FormData();
      formData.append('audio', sourceAudioFile);
      formData.append('voice_id', targetVoiceId);
      formData.append('model_id', 'eleven_multilingual_sts_v2');
      
      // Using the correct endpoint for speech-to-speech conversion
      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-speech/convert', {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData
      });
      
      // Log the response status for debugging
      console.log('Conversion response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to convert audio';
        try {
          const errorData = await response.json();
          console.error('Audio conversion error response:', errorData);
          errorMessage = errorData?.detail?.message || 
                        (typeof errorData?.detail === 'string' ? errorData.detail : errorMessage);
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Audio conversion error:', error);
      throw error;
    }
  }
}
