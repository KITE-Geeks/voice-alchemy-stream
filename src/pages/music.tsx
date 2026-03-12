import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Download, Loader2, Pause, Play } from 'lucide-react';
import { elevenlabsApi } from '@/api/elevenlabsApi.unified';
import { NavTabs } from '@/components/NavTabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGenerationHistory } from '@/contexts/GenerationHistoryContext';
import { GenerationHistoryPanel } from '@/components/GenerationHistoryPanel';

// --- Persistence Utilities ---
import { saveToStorage, loadFromStorage } from '@/utils/storage';

const MUSIC_PROMPT_KEY = 'music_prompt';
const MUSIC_LYRICS_KEY = 'music_lyrics';
const MUSIC_DURATION_KEY = 'music_duration';
const MUSIC_INSTRUMENTAL_KEY = 'music_instrumental';

export default function Music() {
  const location = useLocation();
  const navigate = useNavigate();
  const apiKey = location.state?.apiKey || '';
  const { t } = useLanguage();

  const [prompt, setPrompt] = useState<string>(() => loadFromStorage(MUSIC_PROMPT_KEY, ''));
  const [lyrics, setLyrics] = useState<string>(() => loadFromStorage(MUSIC_LYRICS_KEY, ''));
  const [instrumental, setInstrumental] = useState<boolean>(() => loadFromStorage(MUSIC_INSTRUMENTAL_KEY, 'false') === 'true');
  const [duration, setDuration] = useState<number>(() => {
    const saved = loadFromStorage(MUSIC_DURATION_KEY, '0');
    return isNaN(Number(saved)) ? 0 : Number(saved);
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { addToHistory } = useGenerationHistory();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // If no API key, redirect to landing page
  useEffect(() => {
    if (!apiKey) {
      toast.error('API key missing. Please start from the landing page.');
      navigate('/', { replace: true });
    }
  }, [apiKey, navigate]);

  const handlePromptChange = (val: string) => {
    setPrompt(val);
    saveToStorage(MUSIC_PROMPT_KEY, val);
  };

  const handleLyricsChange = (val: string) => {
    setLyrics(val);
    saveToStorage(MUSIC_LYRICS_KEY, val);
    if (val.trim() && instrumental) {
      setInstrumental(false);
      saveToStorage(MUSIC_INSTRUMENTAL_KEY, 'false');
    }
  };

  const handleInstrumentalChange = (val: boolean) => {
    setInstrumental(val);
    saveToStorage(MUSIC_INSTRUMENTAL_KEY, val.toString());
    if (val && lyrics.trim()) {
      setLyrics('');
      saveToStorage(MUSIC_LYRICS_KEY, '');
    }
  };

  const handleDurationChange = (val: number[]) => {
    const newDuration = val[0];
    setDuration(newDuration);
    saveToStorage(MUSIC_DURATION_KEY, newDuration.toString());
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !lyrics.trim()) {
      toast.warning('Please enter a description or lyrics for the music');
      return;
    }

    // Revoke previous blob URL to avoid memory leaks
    if (currentAudio && currentAudio.startsWith('blob:')) {
      URL.revokeObjectURL(currentAudio);
    }

    setIsGenerating(true);
    try {
      const result = await elevenlabsApi.generateMusic(apiKey, {
        prompt,
        lyrics: lyrics.trim() || undefined,
        instrumental: instrumental,
        duration_seconds: duration > 0 ? duration : undefined,
      });

      // Handle binary response
      const blob = new Blob([result.audio], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      setCurrentAudio(audioUrl);
      
      addToHistory({
        type: 'music',
        input: prompt || lyrics.slice(0, 50),
        audioUrl: audioUrl,
      });

      toast.success(t('music.success'));
      
      // Auto-play
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.load(); // Ensure the new source is loaded
        audioRef.current.play().catch(err => {
          console.error('Auto-play failed:', err);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate music');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate estimated cost
  const estimatedCost = elevenlabsApi.calculateMusicCost(duration || 30);

  return (
    <div className="min-h-screen flex flex-col items-center py-8 bg-background">
      <div className="container mx-auto p-4 max-w-2xl">
        <Card className="w-full">
          <CardContent className="py-8 space-y-6">
            <NavTabs activeTab="music" apiKey={apiKey} />
            
            <h2 className="text-2xl font-bold text-center">{t('music.title')}</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="prompt">{t('music.prompt_label')}</Label>
                <Textarea
                  id="prompt"
                  placeholder={t('music.prompt_placeholder')}
                  value={prompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lyrics">{t('music.lyrics_label')}</Label>
                <Textarea
                  id="lyrics"
                  placeholder={t('music.lyrics_placeholder')}
                  value={lyrics}
                  onChange={(e) => handleLyricsChange(e.target.value)}
                  className="min-h-[150px]"
                  disabled={instrumental}
                />
              </div>

              <div className="flex items-center space-x-2 py-2">
                <Switch
                  id="instrumental"
                  checked={instrumental}
                  onCheckedChange={handleInstrumentalChange}
                />
                <Label htmlFor="instrumental">{t('music.instrumental')}</Label>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between">
                  <Label>
                    {t('music.duration')}: {duration === 0 ? t('music.auto') : `${duration}s (${(duration / 60).toFixed(1)}m)`}
                  </Label>
                </div>
                <Slider
                  value={[duration]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={handleDurationChange}
                />
              </div>

              {/* Cost estimation */}
              <div className="mt-2">
                <div className="text-sm text-muted-foreground">
                  {t('common.cost')} <span className="font-medium">{estimatedCost} {t('common.credits')}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt.trim() && !lyrics.trim())}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('music.generating')}
                  </>
                ) : (
                  t('music.generate')
                )}
              </Button>
            </div>

            {currentAudio && (
              <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center space-y-4 w-full">
                    <audio 
                      ref={audioRef} 
                      src={currentAudio}
                      onEnded={() => setIsPlaying(false)}
                      className="w-full mt-2"
                      controls
                    />
                    <div className="text-center italic text-muted-foreground line-clamp-2 px-4">
                      "{prompt || lyrics.slice(0, 50) + '...'}"
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Generation History */}
        <div className="mt-8">
          <GenerationHistoryPanel />
        </div>
      </div>
    </div>
  );
}
