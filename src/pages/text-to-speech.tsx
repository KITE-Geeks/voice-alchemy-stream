import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { NavTabs } from '@/components/NavTabs';
import { elevenlabsApi, calculateTextToSpeechCost } from '@/api/elevenlabsApi.unified';
import { Voice } from '@/types/voice';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Play, Loader2, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGenerationHistory } from '@/contexts/GenerationHistoryContext';
import { GenerationHistoryPanel } from '@/components/GenerationHistoryPanel';

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
  const { t } = useLanguage();
  const { addToHistory } = useGenerationHistory();
  
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.8);
  
  const voiceListRef = useRef<HTMLDivElement>(null);
  const selectedVoiceRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // If no API key, redirect to landing page
  useEffect(() => {
    if (!apiKey) {
      toast.error('API key missing. Please start from the landing page.');
      navigate('/');
    } else {
      // Load saved data from storage
      setInputText(loadTextFromStorage());
      const savedVoice = loadTTSVoiceFromStorage();
      if (savedVoice) setSelectedVoice(savedVoice);
      const savedAudio = loadTTSAudioFromStorage();
      if (savedAudio) setGeneratedAudio(savedAudio);
      
      // Fetch voices
      const fetchVoices = async () => {
        try {
          const voices = await elevenlabsApi.getVoices(apiKey);
          setVoices(voices);
          
          // If we have a saved voice, verify it still exists
          if (savedVoice && !voices.some(v => v.voice_id === savedVoice)) {
            toast.warning('Previously selected voice no longer available');
            setSelectedVoice('');
          }
        } catch (error) {
          console.error('Error fetching voices:', error);
          toast.error('Failed to load voices');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchVoices();
    }
  }, [apiKey, navigate]);

  // Calculate estimated cost
  const estimatedCost = inputText ? calculateTextToSpeechCost(inputText) : 0;

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
        selectedVoice,
        stability,
        similarityBoost
      );
      
      const audioUrl = `data:audio/mp3;base64,${response.audio}`;
      setGeneratedAudio(audioUrl);
      saveTTSAudioToStorage(audioUrl);
      
      // Add to history
      const voice = voices.find(v => v.voice_id === selectedVoice);
      if (voice) {
        addToHistory({
          type: 'text-to-speech',
          input: inputText,
          voiceName: voice.name,
          audioUrl: audioUrl,
          timestamp: new Date().toISOString()
        });
      }
      
      toast.success('Audio generated successfully');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedAudio) return;
    const link = document.createElement('a');
    link.href = generatedAudio;
    link.download = 'generated_audio.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewVoice = async (voice: Voice) => {
    if (!voice.preview_url) {
      toast.error('No preview available for this voice');
      return;
    }
    
    setPreviewingVoice(voice.voice_id);
    try {
      const audio = new Audio(voice.preview_url);
      audio.onended = () => setPreviewingVoice(null);
      audio.onerror = () => {
        setPreviewingVoice(null);
        toast.error('Failed to play preview');
      };
      await audio.play();
    } catch (error) {
      console.error('Preview error:', error);
      setPreviewingVoice(null);
      toast.error('Failed to play preview');
    }
  };

  // Filter out voices with 'hidden' in the name
  const filteredVoices = voices.filter(v => !v.name.toLowerCase().includes('hidden'));

  return (
    <div className="min-h-screen flex flex-col items-center py-8 bg-background">
      <Card className="w-full max-w-2xl mb-8">
        <CardContent className="py-8">
          <NavTabs />
          <h2 className="text-2xl font-bold mb-4 text-center">
            {t('text_to_speech.title')}
          </h2>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center text-muted-foreground">
                {t('common.loading_voices')}
              </div>
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
                        className={`w-full px-2 py-0.5 rounded-lg border cursor-pointer transition-colors flex flex-col group ${
                          selectedVoice === voice.voice_id 
                            ? 'border-primary bg-muted' 
                            : 'border-border bg-background hover:bg-accent/50'
                        }`}
                        onClick={() => {
                          setSelectedVoice(voice.voice_id);
                          saveTTSVoiceToStorage(voice.voice_id);
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={selectedVoice === voice.voice_id}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-base flex-1 mr-2">
                            {voice.name}
                          </span>
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
                        <div className="text-xs text-muted-foreground truncate max-w-full leading-none">
                          {voice.category}
                        </div>
                        {voice.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-full leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {voice.description}
                          </div>
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
                    onChange={(e) => {
                      setInputText(e.target.value);
                      saveTextToStorage(e.target.value);
                    }}
                    className="min-h-[120px]"
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {t('common.cost')} <span className="font-medium">{Math.round(estimatedCost)} {t('common.credits')}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>
                      {t('text_to_speech.stability')} ({stability.toFixed(1)})
                    </Label>
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
                    <Label>
                      {t('text_to_speech.similarity_boost')} ({similarityBoost.toFixed(1)})
                    </Label>
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
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-semibold">
                      {t('common.generated_audio')}
                    </h3>
                    <audio
                      ref={audioRef}
                      controls
                      src={generatedAudio}
                      className="w-full"
                    />
                    <Button 
                      onClick={handleDownload} 
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('text_to_speech.download_generated')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Generation History */}
      <div className="w-full max-w-2xl">
        <GenerationHistoryPanel />
      </div>
    </div>
  );
}
