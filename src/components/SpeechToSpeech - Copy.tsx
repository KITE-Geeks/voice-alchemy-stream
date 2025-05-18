import { useState, useCallback, useEffect } from 'react';
import { elevenlabsApi, Voice } from '../api/elevenlabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Card, CardContent } from './ui/card';
import { Play, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NavTabs } from './NavTabs';

export function SpeechToSpeech() {
  const location = useLocation();
  const navigate = useNavigate();
  const apiKey = location.state?.apiKey || '';

  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [convertedAudio, setConvertedAudio] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // for voices
  const [isGenerating, setIsGenerating] = useState(false); // for conversion
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleConvert = async () => {
    if (!apiKey || !selectedVoice || !audioFile) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await elevenlabsApi.convertSpeechToSpeech(
        apiKey,
        selectedVoice,
        audioFile,
        stability,
        similarityBoost
      );
      setConvertedAudio(response.audio);
      toast.success('Audio converted successfully');
    } catch (error) {
      toast.error('Failed to convert audio');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!convertedAudio) return;

    const link = document.createElement('a');
    link.href = `data:audio/mpeg;base64,${convertedAudio}`;
    link.download = 'converted_audio.mp3';
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
          <h1 className="text-2xl font-bold mb-6 text-center">Speech to Speech Converter</h1>
          <div className="space-y-4">
            {!voicesLoaded || isLoading ? (
              <div className="text-center text-muted-foreground">Loading voices...</div>
            ) : (
              <>
                <div>
                  <Label htmlFor="voice">Select Voice</Label>
                  <div className="flex flex-col gap-0.5 py-1 max-h-72 overflow-y-auto border rounded-md bg-background">
                    {filteredVoices.map((voice) => (
                      <div
                        key={voice.voice_id}
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
                  <Label htmlFor="audioFile">Upload Audio File</Label>
                  <Input
                    id="audioFile"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                  />
                </div>

                <div>
                  <Label>Stability ({stability})</Label>
                  <Slider
                    value={[stability]}
                    onValueChange={([value]) => setStability(value)}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>

                <div>
                  <Label>Similarity Boost ({similarityBoost})</Label>
                  <Slider
                    value={[similarityBoost]}
                    onValueChange={([value]) => setSimilarityBoost(value)}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>

                <Button
                  onClick={handleConvert}
                  disabled={isGenerating || !apiKey || !selectedVoice || !audioFile}
                  className="w-full"
                >
                  {isGenerating ? 'Converting...' : 'Convert'}
                </Button>

                {convertedAudio && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Converted Audio</h3>
                        <audio
                          controls
                          src={`data:audio/mpeg;base64,${convertedAudio}`}
                          className="w-full"
                        />
                        <Button onClick={handleDownload} className="w-full">
                          Download Converted Audio
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