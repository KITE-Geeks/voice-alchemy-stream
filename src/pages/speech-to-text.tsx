import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, AlertCircle, Download, Loader2, Volume2 } from 'lucide-react';
import { elevenlabsApi } from '@/api/elevenlabsApi.unified';
import { NavTabs } from '@/components/NavTabs';

export default function VoiceIsolator() {
  const location = useLocation();
  const navigate = useNavigate();
  const apiKey = location.state?.apiKey || '';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string | null>(null);

  if (!apiKey) {
    navigate('/', { replace: true });
    return null;
  }

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
    toast.success(`File uploaded: ${file.name}`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
    <div className="container mx-auto py-8 px-4">
      <NavTabs activeTab="speech-to-text" apiKey={apiKey} />
      
      <Card className="w-full max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Voice Isolator</CardTitle>
          <CardDescription>
            Remove background noise and isolate voice from audio files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>How it works</AlertTitle>
            <AlertDescription>
              Upload an audio file to isolate the voice and remove background noise.
              This tool uses ElevenLabs' advanced AI to separate voice from other sounds.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-4">
            <div 
              className={`border-2 ${audioFile ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-dashed'} rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors`}
              onClick={handleUploadClick}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="audio/*"
                onChange={handleFileChange}
              />
              
              {audioFile ? (
                <div className="flex flex-col items-center">
                  <Volume2 className="h-12 w-12 text-green-500 mb-2" />
                  <p className="font-medium">{audioFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <p className="text-sm text-primary mt-2">Click to change file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-12 w-12 text-primary mb-2" />
                  <p className="font-medium">Click to upload an audio file</p>
                  <p className="text-sm text-muted-foreground">
                    MP3, WAV or other audio formats (max 10MB)
                  </p>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleIsolateVoice} 
              disabled={!audioFile || isProcessing}
              className="w-full py-6"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Isolate Voice
                </>
              )}
            </Button>
          </div>
          
          {processedAudioUrl && (
            <Card className="mt-6 bg-muted/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="text-primary" /> Isolated Voice
                </CardTitle>
                <CardDescription>
                  Background noise has been removed from your audio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <audio 
                  ref={audioRef}
                  controls 
                  className="w-full mb-4" 
                  src={processedAudioUrl}
                />
                
                <Button 
                  onClick={handleDownload} 
                  variant="outline" 
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Processed Audio
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}