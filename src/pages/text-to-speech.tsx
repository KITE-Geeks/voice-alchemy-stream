import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { NavTabs } from '@/components/NavTabs';
import { elevenlabsApi, calculateTextToSpeechCost } from '@/api/elevenlabsApi.unified';
import { Voice } from '@/types/voice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Play, Loader2, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

// --- Persistence Utilities ---
import { saveToStorage, loadFromStorage, removeFromStorage } from '@/utils/storage';

const TTS_TEXT_KEY = 'texttospeech_text';
const TTS_SELECTED_VOICE_KEY = 'texttospeech_selected_voice';
const TTS_CONVERTED_AUDIO_KEY = 'texttospeech_converted_audio';

function saveTextToStorage(text: string) {
  saveToStorage(TTS_TEXT_KEY, text);
}

function loadTextFromStorage(): string {
  return loadFromStorage(TTS_TEXT_KEY, '');
}

function saveTTSVoiceToStorage(voiceId: string) {
  saveToStorage(TTS_SELECTED_VOICE_KEY, voiceId);
}

function loadTTSVoiceFromStorage(): string {
  return loadFromStorage(TTS_SELECTED_VOICE_KEY, '');
}

function saveTTSAudioToStorage(audio: string | null) {
  if (audio) {
    saveToStorage(TTS_CONVERTED_AUDIO_KEY, audio);
  } else {
    removeFromStorage(TTS_CONVERTED_AUDIO_KEY);
  }
}

function loadTTSAudioFromStorage(): string | null {
  return loadFromStorage(TTS_CONVERTED_AUDIO_KEY, null);
}

export default function TextToSpeech() {
  const location = useLocation();
  const navigate = useNavigate();
  const apiKey = location.state?.apiKey || '';
  const { t, language } = useLanguage();

  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoiceState] = useState<string>(() => loadTTSVoiceFromStorage());
  const [inputText, setInputTextState] = useState<string>(() => loadTextFromStorage());
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [generatedAudio, setGeneratedAudioState] = useState<string | null>(() => loadTTSAudioFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Auto-scroll refs
  const voiceListRef = useRef<HTMLDivElement>(null);
  const selectedVoiceRef = useRef<HTMLDivElement>(null);

  // Calculate cost
  const estimatedCost = calculateTextToSpeechCost(inputText);

  // Persistence setters
  const setInputText = (text: string) => {
    setInputTextState(text);
    saveTextToStorage(text);
    setGeneratedAudioState(null);
    saveTTSAudioToStorage(null);
  };
  const setSelectedVoice = (voiceId: string) => {
    setSelectedVoiceState(voiceId);
    saveTTSVoiceToStorage(voiceId);
  };
  const setGeneratedAudio = (audio: string | null) => {
    setGeneratedAudioState(audio);
    saveTTSAudioToStorage(audio);
  };

  // If no API key, redirect to landing page
  useEffect(() => {
    if (!apiKey) {
      toast.error('API key missing. Please start from the landing page.');
      navigate('/', { replace: true });
    }
  }, [apiKey, navigate]);

  // Auto-load voices on mount
  useEffect(() => {
    if (apiKey && !voicesLoaded) {
      (async () => {
        try {
          setIsLoading(true);
          const voices = await elevenlabsApi.getVoices(apiKey);
          setVoices(voices);
          setVoicesLoaded(true);
          toast.success('Voices loaded successfully');
        } catch (error) {
          toast.error('Failed to load voices.');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [apiKey, voicesLoaded]);

  // Auto-scroll to selected voice
  useEffect(() => {
    if (selectedVoiceRef.current && voiceListRef.current) {
      selectedVoiceRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedVoice, voicesLoaded]);

  const handleGenerate = async () => {
    if (!apiKey || !selectedVoice || !inputText.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await elevenlabsApi.textToSpeech(
        apiKey,
        inputText,
        selectedVoice
      );
      setGeneratedAudio(response.audio);
      toast.success('Audio generated successfully');
    } catch (error) {
      toast.error('Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedAudio) return;
    const link = document.createElement('a');
    link.href = `data:audio/mpeg;base64,${generatedAudio}`;
    link.download = 'generated_audio.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewVoice = async (voice: Voice) => {
    if (!voice.preview_url) {
      toast.error('No preview available for this voice.');
      return;
    }
    setPreviewingVoice(voice.voice_id);
    try {
      const audio = new Audio(voice.preview_url);
      audio.onended = () => setPreviewingVoice(null);
      audio.onerror = (e) => {
        setPreviewingVoice(null);
        toast.error('Failed to play preview.');
        console.error('Audio preview error:', e);
      };
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          setPreviewingVoice(null);
          toast.error('Playback was blocked by the browser.');
          console.error('Playback blocked:', err);
        });
      }
    } catch (err) {
      setPreviewingVoice(null);
      toast.error('Unexpected error during preview.');
      console.error('Unexpected preview error:', err);
    }
  };

  // Filter out voices with 'hidden' in the name
  const filteredVoices = voices.filter(v => !v.name.toLowerCase().includes('hidden'));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Card className="w-full max-w-2xl">
        <CardContent className="py-8">
          <NavTabs />
          <h2 className="text-2xl font-bold mb-4 text-center">{t('text_to_speech.title')}</h2>
          <div className="space-y-4">
            {!voicesLoaded || isLoading ? (
              <div className="text-center text-muted-foreground">{t('common.loading_voices')}</div>
            ) : (
              <>
                <div>
                  <Label htmlFor="voice">{t('common.select_voice')}</Label>
                  <div
                    ref={voiceListRef}
                    className="flex flex-col gap-0.5 py-1 max-h-72 overflow-y-auto border rounded-md bg-background"
                  >
                    {filteredVoices.map((voice) => (
                      <div
                        key={voice.voice_id}
                        ref={selectedVoice === voice.voice_id ? selectedVoiceRef : undefined}
                        className={`w-full px-2 py-0.5 rounded-lg border cursor-pointer transition-colors flex flex-col group ${selectedVoice === voice.voice_id ? 'border-primary bg-muted' : 'border-border bg-background'}`}
                        onClick={() => setSelectedVoice(voice.voice_id)}
                        tabIndex={0}
                        role="button"
                        aria-pressed={selectedVoice === voice.voice_id}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-base flex-1 mr-2">{voice.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handlePreviewVoice(voice);
                            }}
                            disabled={!!previewingVoice || !voice.preview_url}
                            className="ml-1"
                          >
                            {!voice.preview_url ? (
                              <span className="text-xs">N/A</span>
                            ) : previewingVoice === voice.voice_id ? (
                              <Loader2 className="animate-spin w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-full leading-none">{voice.category}</div>
                        {voice.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-full leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">{voice.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="text">{t('text_to_speech.enter_text')}</Label>
                  <Textarea
                    id="text"
                    placeholder={t('text_to_speech.text_placeholder')}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="h-32"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {t('common.estimated_cost')} {estimatedCost} {t('common.credits')}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>{t('text_to_speech.stability')} ({stability})</Label>
                    <Slider
                      value={[stability]}
                      onValueChange={([value]) => setStability(value)}
                      min={0}
                      max={1}
                      step={0.1}
                      className="my-2"
                    />
                    <div className="text-xs text-muted-foreground">
                      {t('text_to_speech.stability_description')}
                    </div>
                  </div>

                  <div>
                    <Label>{t('text_to_speech.similarity_boost')} ({similarityBoost})</Label>
                    <Slider
                      value={[similarityBoost]}
                      onValueChange={([value]) => setSimilarityBoost(value)}
                      min={0}
                      max={1}
                      step={0.1}
                      className="my-2"
                    />
                    <div className="text-xs text-muted-foreground">
                      {t('text_to_speech.similarity_description')}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !selectedVoice || !inputText.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.generating')}
                    </>
                  ) : (
                    t('text_to_speech.generate_audio')
                  )}
                </Button>

                {generatedAudio && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">{t('common.generated_audio')}</h3>
                        <audio
                          controls
                          src={`data:audio/mpeg;base64,${generatedAudio}`}
                          className="w-full"
                        />
                        <Button onClick={handleDownload} className="w-full">
                          {t('text_to_speech.download_generated')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
