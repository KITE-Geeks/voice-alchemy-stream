import React, { useState, useEffect, useRef } from 'react';
import toWav from 'audiobuffer-to-wav';
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

// --- Persistence Utilities ---
const AUDIO_FILE_KEY = 'speech2speech_audio_file';
const SELECTED_VOICE_KEY = 'speech2speech_selected_voice';
const CONVERTED_AUDIO_KEY = 'speech2speech_converted_audio';
const INPUT_MODE_KEY = 'speech2speech_input_mode';

function saveAudioFileToStorage(file: File | null) {
  if (!file) {
    localStorage.removeItem(AUDIO_FILE_KEY);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem(AUDIO_FILE_KEY, JSON.stringify({
      name: file.name,
      type: file.type,
      data: reader.result,
    }));
  };
  reader.readAsDataURL(file);
}
function loadAudioFileFromStorage(): File | null {
  const stored = localStorage.getItem(AUDIO_FILE_KEY);
  if (!stored) return null;
  try {
    const { name, type, data } = JSON.parse(stored);
    if (!data) return null;
    const arr = data.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || type;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], name, { type: mime });
  } catch {
    return null;
  }
}
function saveSelectedVoiceToStorage(voiceId: string) {
  localStorage.setItem(SELECTED_VOICE_KEY, voiceId);
}
function loadSelectedVoiceFromStorage(): string {
  return localStorage.getItem(SELECTED_VOICE_KEY) || '';
}
function saveConvertedAudioToStorage(audio: string | null) {
  if (audio)
    localStorage.setItem(CONVERTED_AUDIO_KEY, audio);
  else
    localStorage.removeItem(CONVERTED_AUDIO_KEY);
}
function loadConvertedAudioFromStorage(): string | null {
  return localStorage.getItem(CONVERTED_AUDIO_KEY) || null;
}
function saveInputModeToStorage(mode: 'upload' | 'record') {
  localStorage.setItem(INPUT_MODE_KEY, mode);
}
function loadInputModeFromStorage(): 'upload' | 'record' {
  const mode = localStorage.getItem(INPUT_MODE_KEY);
  return mode === 'record' ? 'record' : 'upload';
}

// --- AudioRecorder Component ---
function AudioRecorder({ onAudioReady, initialAudioUrl }: { onAudioReady: (file: File | null) => void, initialAudioUrl?: string }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Convert WebM Blob to WAV Blob using audiobuffer-to-wav
  const webmBlobToWav = async (blob: Blob): Promise<Blob> => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const wavBuffer = toWav(audioBuffer);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  const startRecording = async () => {
    setAudioUrl(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          const wavBlob = await webmBlobToWav(audioBlob);
          const file = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
          const url = URL.createObjectURL(wavBlob);
          setAudioUrl(url);
          onAudioReady(file);
        } else {
          setAudioUrl(null);
          onAudioReady(null);
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      toast.error('Could not access microphone.');
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const clearAudio = () => {
    setAudioUrl(null);
    setRecording(false);
    onAudioReady(null);
  };

  useEffect(() => {
    // If initialAudioUrl changes (restored from storage), set it
    if (initialAudioUrl) {
      setAudioUrl(initialAudioUrl);
    }
  }, [initialAudioUrl]);

  return (
    <div>
      <Button
        onClick={recording ? stopRecording : startRecording}
        className={recording ? 'bg-red-600 hover:bg-red-700' : ''}
        type="button"
      >
        {recording ? 'Stop Recording' : 'Start Recording'}
      </Button>
      {audioUrl && (
        <div className="mt-2 flex flex-col gap-2">
          <audio controls src={audioUrl} className="w-full" />
          <Button variant="outline" onClick={clearAudio} type="button">
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Main Component ---
export function SpeechToSpeech() {
  const location = useLocation();
  const navigate = useNavigate();
  const apiKey = location.state?.apiKey || '';

  const [voices, setVoices] = useState<Voice[]>([]);
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // --- Persistent state ---
  const [audioFile, setAudioFileState] = useState<File | null>(() => loadAudioFileFromStorage());
  const [selectedVoice, setSelectedVoiceState] = useState<string>(() => loadSelectedVoiceFromStorage());
  const [convertedAudio, setConvertedAudioState] = useState<string | null>(() => loadConvertedAudioFromStorage());
  const [inputMode, setInputModeState] = useState<'upload' | 'record'>(() => loadInputModeFromStorage());
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);

  // Persistent setters
  const setAudioFile = (file: File | null) => {
    setAudioFileState(file);
    saveAudioFileToStorage(file);
    if (file && file.type.startsWith('audio/')) {
      setLastAudioUrl(URL.createObjectURL(file));
    } else {
      setLastAudioUrl(null);
    }
  };
  const setSelectedVoice = (voiceId: string) => {
    setSelectedVoiceState(voiceId);
    saveSelectedVoiceToStorage(voiceId);
  };
  const setConvertedAudio = (audio: string | null) => {
    setConvertedAudioState(audio);
    saveConvertedAudioToStorage(audio);
  };
  const setInputMode = (mode: 'upload' | 'record') => {
    setInputModeState(mode);
    saveInputModeToStorage(mode);
  };

  // On mount, restore last audio URL if possible
  useEffect(() => {
    if (audioFile && audioFile.type.startsWith('audio/')) {
      setLastAudioUrl(URL.createObjectURL(audioFile));
    }
  }, [audioFile]);

  // Redirect if no API key
  useEffect(() => {
    if (!apiKey) {
      toast.error('API key missing. Please start from the landing page.');
      navigate('/', { replace: true });
    }
  }, [apiKey, navigate]);

  // Load voices
  useEffect(() => {
    if (apiKey && !voicesLoaded) {
      (async () => {
        try {
          setIsLoading(true);
          const voices = await elevenlabsApi.getVoices(apiKey);
          setVoices(voices);
          setVoicesLoaded(true);
          toast.success('Voices loaded successfully');
        } catch {
          toast.error('Failed to load voices.');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [apiKey, voicesLoaded]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setConvertedAudio(null); // Clear converted audio if new file is uploaded
      setInputMode('upload');
    }
  };

  // Clear audio file (for both upload and record)
  const clearAudioFile = () => {
    setAudioFile(null);
    setConvertedAudio(null);
    setLastAudioUrl(null);
  };

  // Convert audio
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
    } catch {
      toast.error('Failed to convert audio');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download converted audio
  const handleDownload = () => {
    if (!convertedAudio) return;
    const link = document.createElement('a');
    link.href = `data:audio/mpeg;base64,${convertedAudio}`;
    link.download = 'converted_audio.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Voice preview
  const handlePreviewVoice = async (voice: Voice) => {
    if (!voice.preview_url) {
      toast.error('No preview available for this voice.');
      return;
    }
    setPreviewingVoice(voice.voice_id);
    try {
      const audio = new Audio(voice.preview_url);
      audio.onended = () => setPreviewingVoice(null);
      audio.onerror = () => {
        setPreviewingVoice(null);
        toast.error('Failed to play preview.');
      };
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setPreviewingVoice(null);
          toast.error('Playback was blocked by the browser.');
        });
      }
    } catch {
      setPreviewingVoice(null);
      toast.error('Unexpected error during preview.');
    }
  };

  // Filter voices to exclude hidden ones
  const filteredVoices = voices.filter(v => !v.name.toLowerCase().includes('hidden'));

  // --- Auto-scroll to selected voice ---
  const voiceListRef = useRef<HTMLDivElement>(null);
  const selectedVoiceRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedVoiceRef.current && voiceListRef.current) {
      selectedVoiceRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedVoice, voicesLoaded]);

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
                {/* Voice selection */}
                <div>
                  <Label htmlFor="voice">Select Voice</Label>
                  <div
                    ref={voiceListRef}
                    className="flex flex-col gap-0.5 py-1 max-h-72 overflow-y-auto border rounded-md bg-background"
                  >
                    {filteredVoices.map(voice => (
                      <div
                        key={voice.voice_id}
                        ref={selectedVoice === voice.voice_id ? selectedVoiceRef : undefined}
                        className={`w-full px-2 py-0.5 rounded-lg border cursor-pointer transition-colors flex flex-col group ${
                          selectedVoice === voice.voice_id ? 'border-primary bg-muted' : 'border-border bg-background'
                        }`}
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
                            onClick={e => {
                              e.stopPropagation();
                              handlePreviewVoice(voice);
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
                          <div className="text-xs text-muted-foreground truncate max-w-full leading-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {voice.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audio input toggle */}
                <div>
                  <Label>Audio Input</Label>
                  <div className="flex gap-2 mb-2">
                    <Button
                      type="button"
                      variant={inputMode === 'upload' ? 'default' : 'outline'}
                      onClick={() => {
                        setInputMode('upload');
                        clearAudioFile();
                      }}
                    >
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant={inputMode === 'record' ? 'default' : 'outline'}
                      onClick={() => {
                        setInputMode('record');
                        clearAudioFile();
                      }}
                    >
                      Record
                    </Button>
                  </div>
                  {inputMode === 'upload' ? (
                    <Input
                      id="audioFile"
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      disabled={isGenerating}
                    />
                  ) : (
                    <AudioRecorder onAudioReady={file => {
                      setAudioFile(file);
                      setConvertedAudio(null);
                    }} initialAudioUrl={lastAudioUrl} />
                  )}
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    {audioFile
                      ? <>File: <b>{audioFile.name}</b> ({audioFile.type}, {audioFile.size} bytes)</>
                      : <>No audio file selected or recorded.</>
                    }
                  </div>
                </div>

                {/* Stability slider */}
                <div>
                  <Label>Stability ({stability})</Label>
                  <Slider
                    value={[stability]}
                    onValueChange={([value]) => setStability(value)}
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={isGenerating}
                  />
                </div>

                {/* Similarity Boost slider */}
                <div>
                  <Label>Similarity Boost ({similarityBoost})</Label>
                  <Slider
                    value={[similarityBoost]}
                    onValueChange={([value]) => setSimilarityBoost(value)}
                    min={0}
                    max={1}
                    step={0.1}
                    disabled={isGenerating}
                  />
                </div>

                {/* Convert button */}
                <Button
                  onClick={handleConvert}
                  disabled={isGenerating || !apiKey || !selectedVoice || !audioFile}
                  className="w-full"
                >
                  {isGenerating ? 'Converting...' : 'Convert'}
                </Button>

                {/* Converted audio playback and download */}
                {convertedAudio && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Converted Audio</h3>
                        <audio controls src={`data:audio/mpeg;base64,${convertedAudio}`} className="w-full" />
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
