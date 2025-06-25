import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Download, Loader2, Pause, Play } from 'lucide-react';
import { elevenlabsApi } from '@/api/elevenlabsApi.unified';
import { NavTabs } from '@/components/NavTabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGenerationHistory } from '@/contexts/GenerationHistoryContext';
import { GenerationHistoryPanel } from '@/components/GenerationHistoryPanel';

import { SoundFXSettings, GeneratedSound } from '@/types/soundfx';

// --- Persistence Utilities ---
import { saveToStorage, loadFromStorage, saveObjectToStorage, loadObjectFromStorage } from '@/utils/storage';

const SOUNDFX_PROMPT_KEY = 'soundfx_prompt';
const SOUNDFX_SETTINGS_KEY = 'soundfx_settings';

function savePromptToStorage(prompt: string) {
  saveToStorage(SOUNDFX_PROMPT_KEY, prompt);
}

function loadPromptFromStorage(): string {
  return loadFromStorage(SOUNDFX_PROMPT_KEY, '');
}

function saveSettingsToStorage(settings: SoundFXSettings) {
  saveObjectToStorage(SOUNDFX_SETTINGS_KEY, settings);
}

function loadSettingsFromStorage(): SoundFXSettings {
  return loadObjectFromStorage<SoundFXSettings>(
    SOUNDFX_SETTINGS_KEY, 
    { duration: 0, promptAdherence: 75, variationCount: 4 }
  );
}

export default function SoundFX() {
  const location = useLocation();
  const navigate = useNavigate();
  const apiKey = location.state?.apiKey || '';
  const { t, language } = useLanguage();

  const [text, setText] = useState<string>('');
  const [settings, setSettings] = useState<SoundFXSettings>(() => loadSettingsFromStorage());
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSounds, setCurrentSounds] = useState<GeneratedSound[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { addToHistory } = useGenerationHistory();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // If no API key, redirect to landing page
  useEffect(() => {
    if (!apiKey) {
      toast.error('API key missing. Please start from the landing page.');
      navigate('/', { replace: true });
    }
  }, [apiKey, navigate]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTextChange = (newText: string) => {
    setText(newText);
    savePromptToStorage(newText);
  };

  const handleSettingsChange = (newSettings: Partial<SoundFXSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    saveSettingsToStorage(updatedSettings);
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.warning('Please enter a description for the sound effect');
      return;
    }

    if (!apiKey) {
      toast.error('API key is missing. Please go back to the home page and enter your API key.');
      return;
    }

    setIsGenerating(true);
    console.log('Starting sound effect generation with API key:', apiKey ? '***' : 'missing');

    try {
      console.log('Sending request to ElevenLabs API...');
      const params = {
        text,
        model_id: 'eleven_creative_studio_sound_effects',
        output_format: 'mp3_44100_128',
        num_variations: settings.variationCount,
      };
      console.log('Request params:', params);
      
      const result = await elevenlabsApi.generateSoundFX(apiKey, params);
      console.log('Received response from API');

      if (!result.variations || result.variations.length === 0) {
        throw new Error('No sound effect variations received from API');
      }

      // Process all variations
      const newSounds: GeneratedSound[] = [];
      
      // Create a timestamp to group these variations together
      const groupTimestamp = Date.now();
      
      // Process each variation
      for (let i = 0; i < result.variations.length; i++) {
        const variation = result.variations[i];
        
        if (!variation.audio || !(variation.audio instanceof ArrayBuffer)) {
          console.warn(`Variation ${i} has invalid audio data, skipping`);
          continue;
        }
        
        // Convert ArrayBuffer to base64 for storage and playback
        const base64Audio = btoa(
          new Uint8Array(variation.audio).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );

        // Create a unique ID for this variation
        const variationId = `sound-${groupTimestamp}-var-${i}`;
        
        // Add variation number to the prompt for display
        const variationLabel = settings.variationCount > 1 ? ` (${t('sound_fx.variation')} ${i + 1}/${result.variations.length})` : '';
        
        newSounds.push({
          id: variationId,
          audio: base64Audio,
          prompt: `${text}${variationLabel}`,
          timestamp: groupTimestamp,
        });
      }
      
      if (newSounds.length === 0) {
        throw new Error('Failed to process any sound effect variations');
      }
      
      // Current sounds are now managed by the history context
      
      // Set the new sounds as current sounds
      setCurrentSounds(newSounds);
      console.log('Sound effect generated successfully');

      // Add to history and auto-play the first generated sound if available
      if (newSounds.length > 0) {
        // Add to history
        try {
          newSounds.forEach(sound => {
            addToHistory({
              type: 'sound-fx',
              input: sound.prompt,
              audioUrl: `data:audio/mp3;base64,${sound.audio}`,
              // No voiceName for sound effects
            });
          });
        } catch (error) {
          console.error('Failed to add to history:', error);
        }

        // Auto-play the first sound
        try {
          const audio = new Audio(`data:audio/mp3;base64,${newSounds[0].audio}`);
          await audio.play();
        } catch (playError) {
          console.warn('Could not auto-play sound:', playError);
          // Not a critical error, so we don't show a toast
        }
      }
    } catch (err) {
      console.error('Error generating sound effect:', err);
      let errorMessage = 'Failed to generate sound effect';
      
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers
        });
        errorMessage = `API Error: ${err.response.status} - ${err.response.statusText}`;
        
        if (err.response.data) {
          try {
            const errorData = typeof err.response.data === 'string' 
              ? JSON.parse(err.response.data) 
              : err.response.data;
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        errorMessage = 'No response from the server. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', err.message);
        errorMessage = err.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (sound: GeneratedSound) => {
    try {
      const link = document.createElement('a');
      const safePrompt = sound.prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30);
      
      link.href = `data:audio/mp3;base64,${sound.audio}`;
      link.download = `sound-effect-${safePrompt}-${sound.id.slice(-6)}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (err) {
      console.error('Error downloading sound:', err);
      toast.error('Failed to download sound');
    }
  };

  const handlePlaySound = (sound: GeneratedSound) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        
        // If clicking the same sound that's playing, stop it
        if (currentlyPlaying === sound.id) {
          setCurrentlyPlaying(null);
          return;
        }
      }
      
      // Create audio element with base64 data
      const audio = new Audio(`data:audio/mp3;base64,${sound.audio}`);
      audioRef.current = audio;
      
      // Set up event handlers
      const onEnded = () => setCurrentlyPlaying(null);
      const onError = () => {
        setCurrentlyPlaying(null);
        toast.error('Failed to play sound');
      };
      
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);
      
      // Play the audio
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setCurrentlyPlaying(sound.id))
          .catch(error => {
            console.error('Playback failed:', error);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            setCurrentlyPlaying(null);
            toast.error('Playback was prevented by the browser');
          });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      setCurrentlyPlaying(null);
      toast.error('Failed to play sound');
    }
  };

  // Calculate estimated cost using the API function
  // Use the actual duration setting (0 for Auto is handled in the calculation)
  const estimatedCost = elevenlabsApi.calculateSoundFXCost(text || 'Example text', settings.duration, settings.variationCount);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Card className="w-full max-w-2xl">
        <CardContent className="py-8">
          <NavTabs />
          <h2 className="text-2xl font-bold mb-4 text-center">{t('sound_fx.title')}</h2>
          
          <div className="space-y-6">
            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">{t('sound_fx.prompt_label')}</Label>
              <Textarea
                id="prompt"
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={t('sound_fx.prompt_placeholder')}
                className="min-h-[100px]"
                disabled={isGenerating}
              />
            </div>

            {/* Settings */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="duration">
                  {t('sound_fx.duration')}: {settings.duration === 0 ? t('sound_fx.auto') : `${settings.duration.toFixed(1)}s`}
                </Label>
                <Slider
                  id="duration"
                  min={0}
                  max={22}
                  step={0.1}
                  value={[settings.duration]}
                  onValueChange={(value) => handleSettingsChange({ duration: value[0] })}
                  disabled={isGenerating}
                />
              </div>
              
              <div>
                <Label htmlFor="adherence">{t('sound_fx.prompt_adherence')}: {settings.promptAdherence}%</Label>
                <Slider
                  id="adherence"
                  min={0}
                  max={100}
                  step={5}
                  value={[settings.promptAdherence]}
                  onValueChange={(value) => handleSettingsChange({ promptAdherence: value[0] })}
                  disabled={isGenerating}
                />
              </div>
              
              <div>
                <Label htmlFor="variationCount">{t('sound_fx.variations')}: {settings.variationCount}</Label>
                <Slider
                  id="variationCount"
                  min={1}
                  max={8}
                  step={1}
                  value={[settings.variationCount]}
                  onValueChange={(value) => handleSettingsChange({ variationCount: value[0] })}
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Cost estimation */}
            <div className="mt-2">
              <div className="text-sm text-muted-foreground">
                {t('common.cost')} <span className="font-medium">{estimatedCost} {t('common.credits')}</span>
              </div>
            </div>
            
            {/* Generate Button */}
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !text.trim()}
              className="w-full mt-4"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.generating')}
                </>
              ) : (
                t('sound_fx.generate')
              )}
            </Button>

            {/* Current Generation Results */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">{t('sound_fx.current_generation')}</h2>
              {currentSounds.length > 0 ? (
                <div className="grid gap-4">
                  {currentSounds.map((sound) => (
                    <Card key={sound.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{sound.prompt}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(sound.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handlePlaySound(sound)}
                              disabled={isGenerating}
                              className="h-8 w-8"
                              title={currentlyPlaying === sound.id ? t('common.pause') : t('common.play')}
                            >
                              {currentlyPlaying === sound.id ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDownload(sound)}
                              disabled={isGenerating}
                              className="h-8 w-8"
                              title={t('common.download')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {t('sound_fx.no_history')}
                </div>
              )}
            </div>

            {/* Generation History */}
            <div className="mt-8">
              <GenerationHistoryPanel />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
