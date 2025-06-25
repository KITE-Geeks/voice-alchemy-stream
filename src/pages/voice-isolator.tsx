import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, AlertCircle, Download, Loader2, Volume2, Trash2, Play } from 'lucide-react';
import { elevenlabsApi, calculateVoiceIsolationCost } from '@/api/elevenlabsApi.unified';
import { NavTabs } from '@/components/NavTabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGenerationHistory } from '@/contexts/GenerationHistoryContext';
import { GenerationHistoryPanel } from '@/components/GenerationHistoryPanel';

// --- Persistence Utilities ---
import { saveToStorage, loadFromStorage, saveFileToStorage, loadFileFromStorage } from '@/utils/storage';

const AUDIO_FILE_KEY = 'voice_isolator_audio_file';
const PROCESSED_AUDIO_KEY = 'voice_isolator_processed_audio';

function saveAudioFileToStorage(file: File | null) {
  saveFileToStorage(AUDIO_FILE_KEY, file);
}

function loadAudioFileFromStorage(): File | null {
  return loadFileFromStorage(AUDIO_FILE_KEY);
}

function saveProcessedAudioToStorage(url: string | null) {
  if (url) {
    saveToStorage(PROCESSED_AUDIO_KEY, url);
  } else {
    localStorage.removeItem(PROCESSED_AUDIO_KEY);
  }
}

function loadProcessedAudioFromStorage(): string | null {
  const saved = loadFromStorage(PROCESSED_AUDIO_KEY, '');
  return saved || null;
}

export default function VoiceIsolator() {
  const location = useLocation();
  const navigate = useNavigate();
  const apiKey = location.state?.apiKey || '';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { t } = useLanguage();

  const [isProcessing, setIsProcessing] = useState(false);
  
  // --- Persistent state ---
  const [audioFile, setAudioFileState] = useState<File | null>(() => loadAudioFileFromStorage());
  const [processedAudioUrl, setProcessedAudioUrlState] = useState<string | null>(() => loadProcessedAudioFromStorage());
  const [originalAudioUrl, setOriginalAudioUrl] = useState<string | null>(null);
  
  // --- Audio analysis state ---
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const { addToHistory } = useGenerationHistory();

  
  // Persistent setters
  const setAudioFile = (file: File | null) => {
    setAudioFileState(file);
    saveAudioFileToStorage(file);
    
    // Create URL for the original audio file
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setOriginalAudioUrl(url);
    } else {
      setOriginalAudioUrl(null);
    }
  };
  
  const setProcessedAudioUrl = (url: string | null) => {
    setProcessedAudioUrlState(url);
    saveProcessedAudioToStorage(url);
  };
  
  // Function to analyze audio file and get its duration
  const analyzeAudioFile = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      audio.addEventListener('loadedmetadata', () => {
        // Get duration in seconds
        const durationInSeconds = audio.duration;
        URL.revokeObjectURL(url);
        resolve(durationInSeconds);
      });
      
      audio.src = url;
    });
  };
  
  // Restore original audio URL on mount if file exists
  useEffect(() => {
    if (audioFile && audioFile.type.startsWith('audio/')) {
      const url = URL.createObjectURL(audioFile);
      setOriginalAudioUrl(url);
      
      // Analyze audio file to get duration and calculate cost
      analyzeAudioFile(audioFile).then(durationInSeconds => {
        setAudioDuration(durationInSeconds);
        const cost = calculateVoiceIsolationCost(durationInSeconds);
        setEstimatedCost(cost);
      });
    }
    
    // Clean up object URLs when component unmounts
    return () => {
      if (originalAudioUrl) {
        URL.revokeObjectURL(originalAudioUrl);
      }
    };
  }, []);

  if (!apiKey) {
    navigate('/', { replace: true });
    return null;
  }

  // Redirect if no API key
  useEffect(() => {
    if (!apiKey) {
      toast.error('API key missing. Please start from the landing page.');
      navigate('/', { replace: true });
    }
  }, [apiKey, navigate]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check if file is audio
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload an audio file');
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }
    
    setAudioFile(file);
    setProcessedAudioUrl(null); // Reset processed audio when new file is uploaded
    
    // Analyze audio file to get duration and calculate cost
    analyzeAudioFile(file).then(durationInSeconds => {
      setAudioDuration(durationInSeconds);
      const cost = calculateVoiceIsolationCost(durationInSeconds);
      setEstimatedCost(cost);
      toast.success(`File uploaded: ${file.name}`);
    }).catch(error => {
      console.error('Error analyzing audio file:', error);
      toast.error('Error analyzing audio file');
    });
  };
  
  // Clear audio file
  const clearAudioFile = () => {
    setAudioFile(null);
    setProcessedAudioUrl(null);
    setOriginalAudioUrl(null);
    setAudioDuration(null);
    setEstimatedCost(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  


  const handleIsolateVoice = async () => {
    if (!audioFile) {
      toast.error('Please upload an audio file first');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await elevenlabsApi.isolateVoice(apiKey, audioFile);
      
      // Convert ArrayBuffer to a Blob and create a URL
      const blob = new Blob([response.audio], { type: response.mimeType });
      const audioUrl = URL.createObjectURL(blob);
      
      setProcessedAudioUrl(audioUrl);
      
      // Add to history
      addToHistory({
        type: 'voice-isolator',
        input: audioFile.name || 'Audio file',
        audioUrl: audioUrl,
        // No voiceName for voice isolation
      });
      
      toast.success('Voice isolated successfully!');
    } catch (error: any) {
      console.error('Voice isolation error:', error);
      toast.error(error.message || 'Failed to isolate voice');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedAudioUrl || !audioFile) return;
    
    const a = document.createElement('a');
    a.href = processedAudioUrl;
    a.download = `isolated_${audioFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Card className="w-full max-w-2xl">
        <CardContent className="py-8">
          <NavTabs activeTab="voice-isolator" apiKey={apiKey} />
          <h1 className="text-2xl font-bold mb-6 text-center">{t('voice_isolator.title')}</h1>
          
          <div className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('voice_isolator.how_it_works')}</AlertTitle>
              <AlertDescription>
                {t('voice_isolator.description')}
                <br></br>
                <br></br>
                <span className="font-bold text-amber-600 dark:text-amber-400">{t('voice_isolator.warning')}</span> ({t('common.eg')} <a target="_blank" rel="noopener noreferrer" href="https://deepfake-demo.aisec.fraunhofer.de/" className="underline">{t('voice_isolator.here')}</a>)
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Audio input */}
              <div>
                <Label htmlFor="audioFile">{t('voice_isolator.audio_input')}</Label>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    {audioFile ? (
                      <div className="flex items-center gap-2 border rounded-md p-2 bg-muted/10">
                        <div className="flex-1 text-sm truncate">{audioFile.name}</div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleUploadClick}
                          disabled={isProcessing}
                          className="ml-2"
                        >
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={handleUploadClick}
                        disabled={isProcessing}
                        className="w-full"
                      >
                        <Upload className="mr-2 h-4 w-4" /> {t('voice_isolator.upload_audio')}
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      disabled={isProcessing}
                      className="hidden"
                    />
                  </div>
                  {audioFile && (
                    <Button variant="outline" size="sm" onClick={clearAudioFile}>
                      <Trash2 className="h-4 w-4 mr-2" /> {t('voice_isolator.clear')}
                    </Button>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {!audioFile && (
                    <>{t('voice_isolator.upload_audio')} (MP3, WAV, max 10MB)</>
                  )}
                </div>
              </div>
            
              {originalAudioUrl && (
                <div className="border rounded-md p-4 bg-muted/10 mt-4">
                  <h3 className="text-lg font-medium mb-2">{t('common.original_audio')}</h3>
                  <audio 
                    controls 
                    className="w-full mb-2" 
                    src={originalAudioUrl}
                  />
                </div>
              )}
              
              {/* Display estimated cost */}
              {estimatedCost !== null && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground">
                    {t('voice_isolator.cost', { '0': estimatedCost })}
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleIsolateVoice}
                disabled={!audioFile || isProcessing}
                className="w-full mt-4"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('voice_isolator.processing')}
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    {t('voice_isolator.isolate_voice')}
                  </>
                )}
              </Button>
            </div>
            
            {processedAudioUrl && (
              <div className="border rounded-md p-4 bg-muted/30 mt-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                  <Volume2 className="text-primary" /> {t('common.processed_audio')}
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('voice_isolator.description').split('.')[0]}.
                </p>
                
                <audio 
                  ref={audioRef}
                  controls 
                  className="w-full mb-4" 
                  src={processedAudioUrl}
                />
                
                <Button 
                  onClick={handleDownload} 
                  className="w-full mt-2"
                >
                  <Download className="mr-2 h-4 w-4" /> {t('voice_isolator.download')}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Generation History */}
      <div className="mt-8">
        <GenerationHistoryPanel />
      </div>
    </div>
  );
}
