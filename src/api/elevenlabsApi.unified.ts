/**
 * Unified ElevenLabs API implementation
 * This file combines functionality from both the functional and class-based API implementations
 */

import axios from 'axios';
import { 
  Voice, 
  TextToSpeechResponse, 
  SpeechToSpeechResponse, 
  SoundFXVariation, 
  SoundFXResponse, 
  SoundFXParams,
  VoiceIsolatorResponse 
} from '@/types/voice';

// API Constants
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Response interfaces
interface VoicesResponse {
  voices: Voice[];
}

/**
 * Calculate the cost of text-to-speech conversion based on ElevenLabs pricing
 * @param text The text to convert
 * @returns The estimated cost in credits
 */
export const calculateTextToSpeechCost = (text: string): number => {
  // ElevenLabs charges per character
  const charactersPerCredit = 1; // Based on their pricing
  return Math.ceil((text.length / charactersPerCredit) * 100) / 100; // Round up to 2 decimal places
};

/**
 * Calculate the cost of voice isolation based on ElevenLabs pricing
 * @param durationInSeconds The duration of the audio in seconds
 * @returns The estimated cost in credits
 */
export const calculateVoiceIsolationCost = (durationInSeconds: number): number => {
  // ElevenLabs charges 1000 characters per minute of audio
  const charactersPerMinute = 1000;
  const durationInMinutes = durationInSeconds / 60;
  
  // Calculate total cost and round up to nearest whole number
  return Math.ceil(durationInMinutes * charactersPerMinute);
};

/**
 * Calculate the cost of speech-to-speech conversion based on ElevenLabs pricing
 * @param durationInSeconds The duration of the audio in seconds
 * @returns The estimated cost in credits
 */
export const calculateSpeechToSpeechCost = (durationInSeconds: number): number => {
  // ElevenLabs charges 1000 characters per minute of audio for speech-to-speech
  const charactersPerMinute = 1000;
  const durationInMinutes = durationInSeconds / 60;
  
  // Calculate total cost and round up to nearest whole number
  return Math.ceil(durationInMinutes * charactersPerMinute);
};

/**
 * Calculate the cost of sound effect generation based on official ElevenLabs API pricing
 * @param text The prompt text
 * @param duration The duration in seconds
 * @param variationCount The number of variations
 * @returns The estimated cost in credits
 */
export const calculateSoundFXCost = (text: string, duration: number, variationCount: number): number => {
  // Base cost for the prompt
  const promptCost = text.length * 0.00003;
  
  // Cost per second of audio
  const durationCost = duration * 0.015;
  
  // Multiply by the number of variations
  const totalCost = (promptCost + durationCost) * variationCount;
  
  return Math.ceil(totalCost * 100) / 100; // Round up to 2 decimal places
};

/**
 * Unified ElevenLabs API service
 * Provides both functional and class-based access patterns
 */
export class ElevenLabsAPI {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Validates the API key by attempting to fetch voices
   * @returns Promise resolving to boolean indicating if key is valid
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
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
      return true;
    } catch (error) {
      console.error('API key validation error (network failure):', error);
      // Network errors should not necessarily invalidate the key
      return false;
    }
  }
  
  /**
   * Gets available voices from ElevenLabs
   * @returns Promise resolving to array of Voice objects
   */
  async getVoices(): Promise<Voice[]> {
    try {
      const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
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
  
  /**
   * Converts text to speech
   * @param text The text to convert
   * @param voiceId The ID of the voice to use
   * @returns Promise resolving to base64 encoded audio
   */
  async textToSpeech(text: string, voiceId: string): Promise<string> {
    try {
      const response = await axios.post<ArrayBuffer>(
        `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
        }
      );

      // Convert ArrayBuffer to base64 (browser-compatible)
      const uint8Array = new Uint8Array(response.data);
      let binary = '';
      for (let i = 0; i < uint8Array.byteLength; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Audio = btoa(binary);
      return base64Audio;
    } catch (error) {
      console.error('Text to speech error:', error);
      throw error;
    }
  }
  
  /**
   * Converts audio using Voice Conversion API
   * @param sourceAudioFile The source audio file
   * @param targetVoiceId The ID of the target voice
   * @returns Promise resolving to audio blob
   */
  async convertAudio(sourceAudioFile: File, targetVoiceId: string): Promise<Blob> {
    try {
      console.log('Converting audio with targetVoiceId:', targetVoiceId);
      console.log('Audio file type:', sourceAudioFile.type, 'size:', sourceAudioFile.size);
      
      // Create form data with the correct parameters
      const formData = new FormData();
      formData.append('audio', sourceAudioFile);
      formData.append('voice_id', targetVoiceId);
      formData.append('model_id', 'eleven_multilingual_sts_v2');
      
      // Use the correct endpoint for speech-to-speech conversion
      const response = await fetch(`${ELEVENLABS_API_URL}/speech-to-speech/${targetVoiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData
      });
      
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

  /**
   * Generates sound effects based on a text prompt
   * @param params The sound effect parameters
   * @returns Promise resolving to sound effect variations
   */
  /**
   * Isolates voice from background noise in audio
   * @param audioFile The audio file to process
   * @returns Promise resolving to isolated voice audio
   */
  async isolateVoice(audioFile: File): Promise<VoiceIsolatorResponse> {
    try {
      console.log('Isolating voice from audio file:', audioFile.name, audioFile.type, audioFile.size);
      
      const formData = new FormData();
      formData.append('audio', audioFile);
      
      const response = await axios.post<ArrayBuffer>(
        `${ELEVENLABS_API_URL}/audio-isolation`,
        formData,
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'arraybuffer',
        }
      );
      
      if (response.status !== 200) {
        throw new Error(`Failed to isolate voice: ${response.statusText}`);
      }
      
      return {
        audio: response.data,
        mimeType: 'audio/mpeg',
      };
    } catch (error) {
      console.error('Voice isolation error:', error);
      if (error.response) {
        console.error('Error details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
        const errorMessage = typeof error.response.data === 'object' && error.response.data.detail 
          ? error.response.data.detail 
          : error.message;
        throw new Error(`Failed to isolate voice: ${errorMessage}`);
      }
      throw error;
    }
  }

  async generateSoundFX(params: SoundFXParams): Promise<SoundFXResponse> {
    try {
      console.log('Using ElevenLabs API URL:', ELEVENLABS_API_URL);
      const numVariations = params.num_variations || 4;
      console.log(`Generating ${numVariations} variations of sound effect`);
      
      // Make separate API calls for each variation to get truly different results
      const variations = [];
      const apiRequests = [];
      
      // Create array of API requests
      for (let i = 0; i < numVariations; i++) {
        apiRequests.push(
          axios({
            method: 'post',
            url: `${ELEVENLABS_API_URL}/sound-generation`,
            data: {
              text: params.text,
              model_id: params.model_id || 'eleven_creative_studio_sound_effects',
              output_format: params.output_format || 'mp3_44100_128',
              // Don't include num_variations parameter here as we're making separate calls
            },
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': this.apiKey,
              'accept': 'audio/mpeg',
            },
            responseType: 'arraybuffer',
          })
        );
      }
      
      // Execute all requests in parallel
      console.log('Making parallel API requests for variations');
      const responses = await Promise.all(apiRequests);
      
      // Process each response
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (!(response.data instanceof ArrayBuffer)) {
          console.warn(`Invalid response format for variation ${i}: expected ArrayBuffer`);
          continue;
        }
        
        variations.push({
          audio: response.data,
          mimeType: 'audio/mpeg',
        });
      }
      
      if (variations.length === 0) {
        throw new Error('Failed to generate any valid sound effect variations');
      }
      
      console.log(`Successfully generated ${variations.length} sound effect variations`);
      return { variations };
    } catch (error) {
      console.error('Failed to generate sound effect:', error);
      if (error.response) {
        console.error('Error details:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
        const errorMessage = typeof error.response.data === 'object' && error.response.data.detail 
          ? error.response.data.detail 
          : error.message;
        throw new Error(`Failed to generate sound effect: ${errorMessage}`);
      }
      throw new Error('Failed to generate sound effect');
    }
  }
}

/**
 * Functional API implementation for backward compatibility
 */
export const elevenlabsApi = {
  /**
   * Gets available voices from ElevenLabs
   * @param apiKey The ElevenLabs API key
   * @returns Promise resolving to array of Voice objects
   */
  async getVoices(apiKey: string): Promise<Voice[]> {
    const api = new ElevenLabsAPI(apiKey);
    return api.getVoices();
  },

  /**
   * Validates the API key
   * @param apiKey The ElevenLabs API key
   * @returns Promise resolving to boolean indicating if key is valid
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    const api = new ElevenLabsAPI(apiKey);
    return api.validateApiKey();
  },

  /**
   * Converts text to speech
   * @param apiKey The ElevenLabs API key
   * @param text The text to convert
   * @param voiceId The ID of the voice to use
   * @returns Promise resolving to base64 encoded audio
   */
  async textToSpeech(apiKey: string, text: string, voiceId: string): Promise<TextToSpeechResponse> {
    const api = new ElevenLabsAPI(apiKey);
    const audio = await api.textToSpeech(text, voiceId);
    return { audio };
  },

  /**
   * Converts speech to speech
   * @param apiKey The ElevenLabs API key
   * @param audioFile The source audio file
   * @param voiceId The ID of the target voice
   * @returns Promise resolving to base64 encoded audio
   */
  async speechToSpeech(apiKey: string, audioFile: File, voiceId: string): Promise<SpeechToSpeechResponse> {
    const api = new ElevenLabsAPI(apiKey);
    const blob = await api.convertAudio(audioFile, voiceId);
    
    // Convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const audio = base64data.split(',')[1]; // Remove the data URL prefix
        resolve({ audio });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  /**
   * Generates sound effects based on a text prompt
   * @param apiKey The ElevenLabs API key
   * @param params The sound effect parameters
   * @returns Promise resolving to sound effect variations
   */
  async generateSoundFX(apiKey: string, params: SoundFXParams): Promise<SoundFXResponse> {
    const api = new ElevenLabsAPI(apiKey);
    return api.generateSoundFX(params);
  },

  /**
   * Calculate the cost of sound effect generation based on official ElevenLabs API pricing
   * @param text The prompt text
   * @param duration The duration in seconds
   * @param variationCount The number of variations
   * @returns The estimated cost in credits
   */
  calculateSoundFXCost(text: string, duration: number, variationCount: number): number {
    // According to ElevenLabs official API pricing (as of May 2025):
    // - 100 credits per generation with auto duration
    // - 20 credits per second when duration is specified
    
    let costPerVariation;
    if (duration === 0) {
      // Auto duration mode - API pricing
      costPerVariation = 100;
    } else {
      // Specific duration mode - API pricing
      costPerVariation = 20 * duration;
    }
    
    // Calculate total cost based on number of variations
    const totalCost = costPerVariation * variationCount;
    
    // Return as whole number (no fractional credits)
    return Math.ceil(totalCost);
  },

  /**
   * Calculate the cost of voice isolation based on audio duration
   * @param durationInSeconds The duration of the audio in seconds
   * @returns The estimated cost in credits
   */
  calculateVoiceIsolationCost(durationInSeconds: number): number {
    // ElevenLabs charges 1000 characters per minute of audio
    const charactersPerMinute = 1000;
    const durationInMinutes = durationInSeconds / 60;
    
    // Calculate total cost and round up to nearest whole number
    return Math.ceil(durationInMinutes * charactersPerMinute);
  },

  /**
   * Calculate the cost of speech-to-speech conversion based on audio duration
   * @param durationInSeconds The duration of the audio in seconds
   * @returns The estimated cost in credits
   */
  calculateSpeechToSpeechCost(durationInSeconds: number): number {
    return calculateSpeechToSpeechCost(durationInSeconds);
  },

  /**
   * Isolates voice from background noise in audio
   * @param apiKey The ElevenLabs API key
   * @param audioFile The audio file to process
   * @returns Promise resolving to isolated voice audio
   */
  async isolateVoice(apiKey: string, audioFile: File): Promise<VoiceIsolatorResponse> {
    const api = new ElevenLabsAPI(apiKey);
    return api.isolateVoice(audioFile);
  }
};
