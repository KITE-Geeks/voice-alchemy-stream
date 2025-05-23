
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ElevenLabsAPI } from '@/api/elevenlabsApi.unified';
import { toast } from '@/components/ui/sonner';
import { ElevenLabsVoice, ConversionState } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Mic, Play, Pause, Download, Upload, Volume } from 'lucide-react';

interface VoiceConverterProps {
  apiKey: string;
}

const VoiceConverter = ({ apiKey }: VoiceConverterProps) => {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [state, setState] = useState<ConversionState>({
    isApiKeyValid: true,
    isUploading: false,
    isConverting: false,
    isPlaying: false,
    sourceAudio: null,
    sourceAudioUrl: null,
    convertedAudioUrl: null,
    selectedVoiceId: null,
    error: null
  });
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const api = new ElevenLabsAPI(apiKey);
  
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const voicesList = await api.getVoices();
        setVoices(voicesList);
        
        // Set default voice if available
        if (voicesList.length > 0) {
          setState(prev => ({
            ...prev,
            selectedVoiceId: voicesList[0].voice_id
          }));
        }
      } catch (error) {
        toast.error('Failed to fetch available voices');
        setState(prev => ({
          ...prev,
          error: 'Failed to load voices'
        }));
      }
    };
    
    fetchVoices();
  }, [apiKey]);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
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
    
    const url = URL.createObjectURL(file);
    
    setState(prev => ({
      ...prev,
      sourceAudio: file,
      sourceAudioUrl: url,
      convertedAudioUrl: null
    }));
    
    toast.success('Audio file uploaded successfully');
  };
  
  const handleVoiceSelect = (voiceId: string) => {
    setState(prev => ({
      ...prev,
      selectedVoiceId: voiceId
    }));
  };
  
  const handleConvert = async () => {
    if (!state.sourceAudio || !state.selectedVoiceId) {
      toast.error('Please upload an audio file and select a voice');
      return;
    }
    
    setState(prev => ({
      ...prev,
      isConverting: true,
      error: null
    }));
    
    try {
      // Add debug logging
      console.log('Converting with voice ID:', state.selectedVoiceId);
      
      const audioBlob = await api.convertAudio(state.sourceAudio, state.selectedVoiceId);
      const url = URL.createObjectURL(audioBlob);
      
      setState(prev => ({
        ...prev,
        convertedAudioUrl: url,
        isConverting: false
      }));
      
      toast.success('Audio conversion completed');
    } catch (error) {
      console.error('Conversion error:', error);
      setState(prev => ({
        ...prev,
        isConverting: false,
        error: 'Failed to convert audio'
      }));
      toast.error('Audio conversion failed');
    }
  };
  
  const togglePlayback = () => {
    if (!audioRef.current || !state.convertedAudioUrl) return;
    
    if (state.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  };
  
  const handleDownload = () => {
    if (!state.convertedAudioUrl) return;
    
    const a = document.createElement('a');
    a.href = state.convertedAudioUrl;
    a.download = 'converted-voice.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Download started');
  };
  
  const handleAudioEnded = () => {
    setState(prev => ({
      ...prev,
      isPlaying: false
    }));
  };

  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-6 w-6 gradient-bg text-white rounded-full p-1" />
            <CardTitle>Upload Voice</CardTitle>
          </div>
          <CardDescription>
            Upload your source audio file (.mp3, .wav, .m4a)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="file"
              id="audio-upload"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={state.isConverting}
            />
            <Button
              onClick={() => document.getElementById('audio-upload')?.click()}
              className="w-full border-dashed border-2 h-24 bg-muted/20 hover:bg-muted/30"
              variant="outline"
              disabled={state.isConverting}
            >
              <div className="flex flex-col items-center justify-center">
                <Mic className="h-6 w-6 mb-2" />
                <span>{state.sourceAudio ? state.sourceAudio.name : 'Click to upload audio'}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Max size: 10MB
                </span>
              </div>
            </Button>
            
            {state.sourceAudioUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Source Audio Preview:</p>
                <audio src={state.sourceAudioUrl} controls className="w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Volume className="h-6 w-6 gradient-bg text-white rounded-full p-1" />
            <CardTitle>Voice Selection</CardTitle>
          </div>
          <CardDescription>
            Choose the target voice for conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              value={state.selectedVoiceId || undefined}
              onValueChange={handleVoiceSelect}
              disabled={voices.length === 0 || state.isConverting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleConvert} 
              className="w-full gradient-bg"
              disabled={!state.sourceAudio || !state.selectedVoiceId || state.isConverting}
            >
              {state.isConverting ? 'Converting...' : 'Convert Voice'}
            </Button>
            
            {state.isConverting && (
              <div className="mt-4 space-y-2">
                <Progress value={50} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  Converting your audio...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {state.convertedAudioUrl && (
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Play className="h-6 w-6 gradient-bg text-white rounded-full p-1" />
              <CardTitle>Converted Voice</CardTitle>
            </div>
            <CardDescription>
              Listen and download your converted audio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="audio-visualization">
                <div className="waveform">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className={`waveform-bar ${state.isPlaying ? 'animate-pulse' : ''}`}
                      style={{
                        height: `${Math.max(15, Math.min(80, Math.random() * 100))}%`,
                        animationDelay: `${i * 0.05}s`
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <audio
                ref={audioRef}
                src={state.convertedAudioUrl}
                onEnded={handleAudioEnded}
                className="hidden"
              />
              
              <div className="audio-controls">
                <Button
                  onClick={togglePlayback}
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-full border-2"
                >
                  {state.isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceConverter;
