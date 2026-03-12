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
  VoiceIsolatorResponse,
  MusicParams,
  MusicResponse
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
      // Sort voices to put premade voices at the bottom
      return data.voices.sort((a: Voice, b: Voice) => {
        // If both are premade or both are not, sort alphabetically by name
        if ((a.category === 'premade') === (b.category === 'premade')) {
          return a.name.localeCompare(b.name);
        }
        // Put premade voices after custom voices
        return a.category === 'premade' ? 1 : -1;
      });
    } catch (error) {
      console.error('Get voices error:', error);
      throw error;
    }
  }
  
  /**
   * Converts text to speech
   * @param text The text to convert
   * @param voiceId The ID of the voice to use
   * @param stability Voice stability setting (0-1)
   * @param similarityBoost Voice similarity boost (0-1)
   * @param useV3 Whether to use the v3 model
   * @param emotion Optional emotion for v3 model
   * @param soundEffect Optional sound effect for v3 model
   * @returns Promise resolving to base64 encoded audio
   */
  async textToSpeech(
    text: string, 
    voiceId: string, 
    stability: number = 0.5, 
    similarityBoost: number = 0.75,
    speed: number = 1.0,
    useV3: boolean = false,
    emotion?: string,
    soundEffect?: string
  ): Promise<string> {
    try {
      // Common request body structure for both v2 and v3
      const requestBody: any = {
        text,
        model_id: useV3 ? 'eleven_v3' : 'eleven_multilingual_v2',
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          speed: speed,
          ...(useV3 && soundEffect !== 'none' ? { voice_effect: soundEffect } : {})
        }
      };

      // NOTE: ElevenLabs v3 uses inline audio tags within `text` for delivery/effects.
      // Do not send separate `emotion` or `sound_effect` fields; those were placeholders.

      // Use the standard endpoint for both v2 and v3
      const endpoint = `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`;
      console.log('Using endpoint:', endpoint, 'with model:', useV3 ? 'eleven_v3' : 'eleven_multilingual_v2');
      
      const response = await axios.post<ArrayBuffer>(
        endpoint,
        requestBody,
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
   * @param stability Voice stability setting (0-1)
   * @param similarityBoost Voice similarity boost (0-1)
   * @returns Promise resolving to audio blob
   */
  async convertAudio(
    sourceAudioFile: File, 
    targetVoiceId: string,
    stability: number = 0.5,
    similarityBoost: number = 0.75
  ): Promise<Blob> {
    try {
      console.log('Converting audio with targetVoiceId:', targetVoiceId);
      console.log('Audio file type:', sourceAudioFile.type, 'size:', sourceAudioFile.size);
      
      // Create form data with the correct parameters
      const formData = new FormData();
      formData.append('audio', sourceAudioFile);
      formData.append('model_id', 'eleven_multilingual_sts_v2');
      
      // Add voice settings as JSON string if provided
      const voiceSettings = {
        stability,
        similarity_boost: similarityBoost,
      };
      formData.append('voice_settings', JSON.stringify(voiceSettings));
      
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
    } catch (error: any) {
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
      const numVariations = params.num_variations || 1;
      console.log(`Generating ${numVariations} variations of sound effect`);
      
      const variations = [];
      const apiRequests = [];
      
      // ElevenLabs sound generation endpoint
      const url = `${ELEVENLABS_API_URL}/sound-generation`;
      
      for (let i = 0; i < numVariations; i++) {
        const requestData: any = {
          text: params.text,
          model_id: params.model_id || 'eleven_text_to_sound_v2',
        };

        if (params.duration_seconds && params.duration_seconds > 0) {
          requestData.duration_seconds = params.duration_seconds;
        }

        if (params.prompt_influence !== undefined) {
          requestData.prompt_influence = params.prompt_influence;
        }

        apiRequests.push(
          axios.post<ArrayBuffer>(
            url,
            requestData,
            {
              headers: {
                'Content-Type': 'application/json',
                'xi-api-key': this.apiKey,
                'accept': 'audio/mpeg',
              },
              responseType: 'arraybuffer',
            }
          )
        );
      }
      
      console.log(`Making ${apiRequests.length} parallel API requests for variations`);
      const responses = await Promise.all(apiRequests);
      
      for (let i = 0; i < responses.length; i++) {
        variations.push({
          audio: responses[i].data,
          mimeType: 'audio/mpeg',
        });
      }
      
      if (variations.length === 0) {
        throw new Error('Failed to generate any valid sound effect variations');
      }
      
      console.log(`Successfully generated ${variations.length} sound effect variations`);
      return { variations };
    } catch (error: any) {
      console.error('Failed to generate sound effect:', error);
      if (error.response) {
        let errorMessage = 'Failed to generate sound effect';
        try {
          if (error.response.data instanceof ArrayBuffer) {
            const decodedString = new TextDecoder().decode(error.response.data);
            const errorData = JSON.parse(decodedString);
            errorMessage = errorData.detail?.message || errorData.detail || errorMessage;
          } else {
            errorMessage = error.response.data?.detail?.message || error.response.data?.detail || errorMessage;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(`API Error: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * Generates music based on a text prompt or lyrics
   * @param params The music generation parameters
   * @returns Promise resolving to generated music audio
   */
  async generateMusic(params: MusicParams): Promise<MusicResponse> {
    try {
      console.log('Generating music with params:', JSON.stringify({
        prompt: params.prompt,
        hasLyrics: !!params.lyrics,
        instrumental: params.instrumental,
        duration: params.duration_seconds
      }));
      
      const requestData: any = {};
      
      if (params.lyrics) {
        // For lyrics, we need to use composition_plan, but handle auto-duration differently
        if (params.duration_seconds && params.duration_seconds > 0) {
          // Specific duration requested - use composition_plan with explicit durations
          const maxDurationMs = 120000; // 2 minutes in milliseconds
          const requestedDurationMs = Math.min(params.duration_seconds * 1000, maxDurationMs);
          
          // Split lyrics into lines and enforce 200 character limit per line
          const lyricsLines = params.lyrics.split('\n').filter(line => line.trim() !== '');
          const truncatedLines = lyricsLines.map(line => {
            if (line.length > 200) {
              console.warn(`Lyrics line truncated from ${line.length} to 200 characters`);
              return line.substring(0, 200);
            }
            return line;
          });
          
          requestData.composition_plan = {
            positive_global_styles: params.prompt ? [params.prompt] : ['Pop song'],
            negative_global_styles: [],
            sections: [
              {
                section_name: 'Intro',
                type: 'instrumental',
                prompt: params.prompt || 'Instrumental intro',
                positive_local_styles: [],
                negative_local_styles: [],
                duration_ms: Math.max(Math.floor(requestedDurationMs * 0.2), 3000), // Min 3s per section
                lines: []
              },
              {
                section_name: 'Verse',
                type: 'vocal',
                prompt: params.prompt || 'Vocal verse',
                lyrics: truncatedLines.join('\n'),
                positive_local_styles: [],
                negative_local_styles: [],
                duration_ms: Math.max(Math.floor(requestedDurationMs * 0.8), 3000), // Min 3s per section
                lines: truncatedLines
              }
            ]
          };
          // respect_sections_durations ensures that model sticks to the plan's timing
          requestData.respect_sections_durations = true;
        } else {
          // Auto duration - use simple prompt + lyrics approach
          const combinedPrompt = params.lyrics 
            ? `${params.prompt || 'Pop song'} use these lyrics: ${params.lyrics}`
            : params.prompt || 'Pop song';
            
          requestData.prompt = combinedPrompt;
          
          if (params.instrumental !== undefined) {
            requestData.force_instrumental = params.instrumental;
          }
        }
      } else {
        requestData.prompt = params.prompt;
        if (params.duration_seconds && params.duration_seconds > 0) {
          requestData.duration_seconds = params.duration_seconds;
        }
        
        if (params.instrumental !== undefined) {
          requestData.force_instrumental = params.instrumental;
        }
      }

      console.log('Sending to ElevenLabs API:', JSON.stringify(requestData, null, 2));
      
      const response = await axios.post<ArrayBuffer>(
        `${ELEVENLABS_API_URL}/music/compose`,
        requestData,
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'accept': 'audio/mpeg',
          },
          responseType: 'arraybuffer',
        }
      );

      return {
        audio: response.data,
        mimeType: 'audio/mpeg',
      };
    } catch (error: any) {
      console.error('Music generation error:', error);
      if (error.response) {
        let errorMessage = 'Failed to generate music';
        try {
          if (error.response.data instanceof ArrayBuffer) {
            const decodedString = new TextDecoder().decode(error.response.data);
            const errorData = JSON.parse(decodedString);
            console.error('Parsed API Error Data:', errorData);
            errorMessage = errorData.detail?.message || errorData.detail || JSON.stringify(errorData) || errorMessage;
          } else {
            console.error('API Error Data:', error.response.data);
            console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
            if (error.response.data.detail && Array.isArray(error.response.data.detail)) {
              console.error('Validation errors:', error.response.data.detail);
              error.response.data.detail.forEach((err: any, index: number) => {
                console.error(`Error ${index + 1}:`, err);
              });
            }
            errorMessage = error.response.data?.detail?.message || error.response.data?.detail || JSON.stringify(error.response.data) || errorMessage;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(`API Error: ${errorMessage}`);
      }
      throw error;
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
   * @param stability Voice stability setting (0-1)
   * @param similarityBoost Voice similarity boost (0-1)
   * @param useV3 Whether to use the v3 model
   * @param emotion Optional emotion for v3 model
   * @param soundEffect Optional sound effect for v3 model
   * @returns Promise resolving to base64 encoded audio
   */
  async textToSpeech(
    apiKey: string, 
    text: string, 
    voiceId: string,
    stability: number = 0.5,
    similarityBoost: number = 0.75,
    speed: number = 1.0,
    useV3: boolean = false,
    emotion?: string,
    soundEffect?: string
  ): Promise<TextToSpeechResponse> {
    const api = new ElevenLabsAPI(apiKey);
    
    // Use correct ElevenLabs API request body format
    const endpoint = `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`;
    const requestBody: any = {
      text,
      model_id: useV3 ? 'eleven_v3' : 'eleven_multilingual_v2',
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
        speed,
        ...(useV3 && soundEffect !== 'none' ? { voice_effect: soundEffect } : {})
      }
    };
    
    console.log('Using endpoint:', endpoint, 'with model:', useV3 ? 'eleven_v3' : 'eleven_multilingual_v2');
    console.log('Voice settings:', {
      stability,
      similarity_boost: similarityBoost,
      speed,
      use_v3: useV3,
      ...(useV3 && soundEffect !== 'none' ? { voice_effect: soundEffect } : {})
    });
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post<ArrayBuffer>(
      endpoint,
      requestBody, // Send as JSON body
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer',
      }
    );
    
    // Convert ArrayBuffer to base64
    const uint8Array = new Uint8Array(response.data);
    let binary = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64Audio = btoa(binary);
    return { audio: base64Audio };
  },

  /**
   * Converts speech to speech
   * @param apiKey The ElevenLabs API key
   * @param audioFile The source audio file
   * @param voiceId The ID of the target voice
   * @param stability Voice stability setting (0-1)
   * @param similarityBoost Voice similarity boost (0-1)
   * @returns Promise resolving to base64 encoded audio
   */
  async speechToSpeech(
    apiKey: string, 
    audioFile: File, 
    voiceId: string,
    stability: number = 0.5,
    similarityBoost: number = 0.75
  ): Promise<SpeechToSpeechResponse> {
    const api = new ElevenLabsAPI(apiKey);
    const blob = await api.convertAudio(audioFile, voiceId, stability, similarityBoost);
    
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
   * Generates music based on a text prompt
   * @param apiKey The ElevenLabs API key
   * @param params The music generation parameters
   * @returns Promise resolving to generated music
   */
  async generateMusic(apiKey: string, params: MusicParams): Promise<MusicResponse> {
    const api = new ElevenLabsAPI(apiKey);
    return api.generateMusic(params);
  },

  /**
   * Calculate the cost of music generation based on duration
   * @param durationInSeconds The duration in seconds
   * @returns The estimated cost in credits
   */
  calculateMusicCost(durationInSeconds: number): number {
    // Official ElevenLabs Music API pricing:
    // 25 credits per second of generated audio
    const creditsPerSecond = 25;
    return Math.ceil(durationInSeconds * creditsPerSecond);
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
