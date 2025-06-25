import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { NavTabs } from '@/components/NavTabs';
import { elevenlabsApi, calculateTextToSpeechCost } from '@/api/elevenlabsApi.unified';
import { Voice } from '@/types/voice';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Play, Loader2, Download, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGenerationHistory } from '@/contexts/GenerationHistoryContext';
import { GenerationHistoryPanel } from '@/components/GenerationHistoryPanel';

// --- Persistence Utilities ---
import { saveToStorage, loadFromStorage, removeFromStorage } from '@/utils/storage';

const TTS_TEXT_KEY = 'texttospeech_text';
const TTS_SELECTED_VOICE_KEY = 'texttospeech_selected_voice';
const TTS_CONVERTED_AUDIO_KEY = 'texttospeech_converted_audio';
const TTS_USE_V3_KEY = 'texttospeech_use_v3';
const TTS_EMOTION_KEY = 'texttospeech_emotion';
const TTS_SOUND_EFFECT_KEY = 'texttospeech_sound_effect';

// Audio tags for v3 model with examples from the prompt guide
const getVocalDeliveryOptions = (t: (key: string) => string) => [
  { value: '[laughs]', label: t('text_to_speech.vocal_delivery_laughs') },
  { value: '[sighs]', label: t('text_to_speech.vocal_delivery_sighs') },
  { value: '[yawns]', label: t('text_to_speech.vocal_delivery_yawns') },
  { value: '[gasps]', label: t('text_to_speech.vocal_delivery_gasps') },
  { value: '[clears throat]', label: t('text_to_speech.vocal_delivery_clears_throat') },
  { value: '[whispers]', label: t('text_to_speech.vocal_delivery_whispers') },
  { value: '[excited]', label: t('text_to_speech.vocal_delivery_excited') },
  { value: '[sad]', label: t('text_to_speech.vocal_delivery_sad') },
  { value: '[angry]', label: t('text_to_speech.vocal_delivery_angry') },
  { value: '[happy]', label: t('text_to_speech.vocal_delivery_happy') },
  { value: '[sarcastic]', label: t('text_to_speech.vocal_delivery_sarcastic') },
  { value: '[serious]', label: t('text_to_speech.vocal_delivery_serious') },
  { value: '[singing]', label: t('text_to_speech.vocal_delivery_singing') },
  { value: '[mumbling]', label: t('text_to_speech.vocal_delivery_mumbling') },
  { value: '[shouting]', label: t('text_to_speech.vocal_delivery_shouting') },
  { value: '[crying]', label: t('text_to_speech.vocal_delivery_crying') },
  { value: '[laughing]', label: t('text_to_speech.vocal_delivery_laughing') },
  { value: '[whistling]', label: t('text_to_speech.vocal_delivery_whistling') },
  { value: '[yawning]', label: t('text_to_speech.vocal_delivery_yawning') },
  { value: '[giggles]', label: t('text_to_speech.vocal_delivery_giggles') },
  { value: '[sniffles]', label: t('text_to_speech.vocal_delivery_sniffles') },
  { value: '[snores]', label: t('text_to_speech.vocal_delivery_snores') },
  { value: '[gulps]', label: t('text_to_speech.vocal_delivery_gulps') }
];



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
  const { t } = useLanguage();
  const { addToHistory } = useGenerationHistory();
  const apiKey = location.state?.apiKey || '';

  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.8);
  const [useV3, setUseV3] = useState(false);
  const [vocalDelivery, setVocalDelivery] = useState('');
  const [soundEffect, setSoundEffect] = useState('none');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Get translated options
  const VOCAL_DELIVERY = getVocalDeliveryOptions(t);
  
  const SOUND_EFFECTS = [
    { value: 'none', label: t('text_to_speech.no_effect') },
    { value: 'echo', label: t('text_to_speech.sound_effect_echo') },
    { value: 'reverb', label: t('text_to_speech.sound_effect_reverb') },
    { value: 'chorus', label: t('text_to_speech.sound_effect_chorus') },
    { value: 'flanger', label: t('text_to_speech.sound_effect_flanger') },
    { value: 'telephone', label: t('text_to_speech.sound_effect_telephone') },
    { value: 'radio', label: t('text_to_speech.sound_effect_radio') },
    { value: 'underwater', label: t('text_to_speech.sound_effect_underwater') },
    { value: 'megaphone', label: t('text_to_speech.sound_effect_megaphone') },
    { value: 'robot', label: t('text_to_speech.sound_effect_robot') },
    { value: 'alien', label: t('text_to_speech.sound_effect_alien') },
    { value: 'helium', label: t('text_to_speech.sound_effect_helium') },
    { value: 'slow_motion', label: t('text_to_speech.sound_effect_slow_motion') },
    { value: 'fast_forward', label: t('text_to_speech.sound_effect_fast_forward') },
    { value: 'vintage_radio', label: t('text_to_speech.sound_effect_vintage_radio') },
    { value: 'dark_whisper', label: t('text_to_speech.sound_effect_dark_whisper') }
  ];
  
  const voiceListRef = useRef<HTMLDivElement>(null);
  const selectedVoiceRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Insert speaker tag at cursor position
  const insertSpeakerTag = (tag: string) => {
    insertAtCursor(tag);
  };

  // If no API key, redirect to landing page
  // Insert text at cursor position
  const insertAtCursor = (text: string) => {
    if (!textAreaRef.current) return;
    
    const start = textAreaRef.current.selectionStart;
    const end = textAreaRef.current.selectionEnd;
    const newText = inputText.substring(0, start) + text + inputText.substring(end);
    
    setInputText(newText);
    
    // Set cursor position after the inserted text
    setTimeout(() => {
      if (textAreaRef.current) {
        const newPos = start + text.length;
        textAreaRef.current.selectionStart = newPos;
        textAreaRef.current.selectionEnd = newPos;
        textAreaRef.current.focus();
      }
    }, 0);
  };

  // Handle vocal delivery selection
  const handleVocalDeliveryChange = (value: string) => {
    console.log('Selected vocal delivery:', value);
    setVocalDelivery(value);
    if (value) {
      console.log('Inserting at cursor:', value);
      insertAtCursor(value + ' ');
      setVocalDelivery(''); // Reset the dropdown
    } else {
      console.log('No value provided to handleVocalDeliveryChange');
    }
  };

  // Handle sound effect selection
  const handleSoundEffectChange = (value: string) => {
    console.log('Selected sound effect:', value);
    setSoundEffect(value);
    if (value && value !== 'none') {
      console.log('Inserting at cursor:', `[${value}]`);
      insertAtCursor(`[${value}] `);
      setSoundEffect('none'); // Reset the dropdown
    }
  };

  useEffect(() => {
    if (!apiKey) {
      toast.error('API key missing. Please start from the landing page.');
      navigate('/');
    } else {
      // Load saved data from storage
      setInputText(loadTextFromStorage());
      
      // Load saved voice and settings
      const savedVoice = loadTTSVoiceFromStorage();
      const savedUseV3 = loadFromStorage(TTS_USE_V3_KEY, 'false') === 'true';
      const savedSoundEffect = loadFromStorage(TTS_SOUND_EFFECT_KEY, 'none');
      
      setSelectedVoice(savedVoice);
      setUseV3(savedUseV3);
      setSoundEffect(savedSoundEffect);
      
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

  // Save settings to storage when they change
  useEffect(() => {
    saveToStorage(TTS_USE_V3_KEY, useV3.toString());
  }, [useV3]);

  useEffect(() => {
    if (soundEffect) saveToStorage(TTS_SOUND_EFFECT_KEY, soundEffect);
  }, [soundEffect]);

  // Calculate estimated cost
  const estimatedCost = inputText ? calculateTextToSpeechCost(inputText) : 0;

  const handleGenerate = async () => {
    if (!apiKey || !selectedVoice || !inputText.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsGenerating(true);
      // For now, we're not sending vocal delivery tags to the API
      // as they're already inserted into the text
      const response = await elevenlabsApi.textToSpeech(
        apiKey,
        inputText,
        selectedVoice,
        stability,
        similarityBoost,
        useV3,
        undefined, // emotion parameter removed
        useV3 && soundEffect !== 'none' ? soundEffect : undefined
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
          model: useV3 ? 'Eleven Turbo v2' : 'Eleven Multilingual v2',
          soundEffect: useV3 && soundEffect !== 'none' ? soundEffect : undefined
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
          <h2 className="text-2xl font-bold mb-6 text-center">
            {t('text_to_speech.title')}
          </h2>
          
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-4">
                {t('common.loading_voices')}
              </div>
            ) : (
              <div className="space-y-4">
                {/* V3 Model Toggle */}
                <div className="flex items-center space-x-2 mb-4">
                  <Switch 
                    id="v3-toggle"
                    checked={useV3} 
                    onCheckedChange={(checked) => {
                      setUseV3(checked);
                      saveToStorage(TTS_USE_V3_KEY, checked.toString());
                      if (!checked) {
                        setVocalDelivery('');
                        setSoundEffect('none');
                      }
                    }}
                  />
                  <Label htmlFor="v3-toggle">{t('text_to_speech.use_v3_model')}</Label>
                </div>

                {/* Voice Selection */}
                <div className="space-y-2">
                  <Label htmlFor="voice-select">Select Voice</Label>
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
                <div className="mb-2">
                  <Label htmlFor="text">{t('text_to_speech.enter_text')}</Label>
                </div>
                <Textarea
                  id="text"
                  ref={textAreaRef}
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
              
              {/* Generate Button - Only show if not in v3 mode */}
              {!useV3 && (
                <div className="mt-4">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !inputText.trim() || !selectedVoice}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('common.generating')}
                      </>
                    ) : (
                      <>{t('text_to_speech.generate_audio')}</>
                    )}
                  </Button>
                </div>
              )}

              {useV3 && (
                <div className="mt-4 p-4 bg-muted/20 rounded-lg border border-muted">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t('text_to_speech.vocal_delivery')}</Label>
                      <p className="text-xs text-muted-foreground mb-1">{t('text_to_speech.vocal_delivery_description')}</p>
                      <Select 
                        value={vocalDelivery}
                        onValueChange={handleVocalDeliveryChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('text_to_speech.select_vocal_expression')} />
                        </SelectTrigger>
                        <SelectContent>
                          {VOCAL_DELIVERY.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t('text_to_speech.audio_effect')}</Label>
                      <p className="text-xs text-muted-foreground mb-1">{t('text_to_speech.audio_effect_description')}</p>
                      <Select 
                        value={soundEffect}
                        onValueChange={handleSoundEffectChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('text_to_speech.select_audio_effect')} />
                        </SelectTrigger>
                        <SelectContent>
                          {SOUND_EFFECTS.map((effect) => (
                            <SelectItem key={effect.value} value={effect.value}>
                              {effect.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('text_to_speech.example_tags_description')}
                  </p>
                  <div>
                    <div 
                      className="cursor-pointer flex items-center justify-between mt-4 pt-2 border-t"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      <h3 className="text-sm font-medium">
                        {t('text_to_speech.advanced_settings')}
                      </h3>
                      {showAdvanced ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    
                    {showAdvanced && (
                      <div className="space-y-4 pl-2 border-l-2 border-muted mt-2">
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
                            {t('text_to_speech.similarity_boost_description')}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button 
                      onClick={handleGenerate} 
                      disabled={isGenerating || !inputText.trim() || !selectedVoice}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('common.generating')}
                        </>
                      ) : (
                        <>{t('text_to_speech.generate_audio')}</>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
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
