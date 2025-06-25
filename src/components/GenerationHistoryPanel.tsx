import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useGenerationHistory, GenerationType } from '@/contexts/GenerationHistoryContext';
import { Download, Trash2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

const getTypeLabel = (type: GenerationType): string => {
  switch (type) {
    case 'text-to-speech':
      return 'Text to Speech';
    case 'speech-to-speech':
      return 'Speech to Speech';
    case 'sound-fx':
      return 'Sound FX';
    case 'voice-isolator':
      return 'Voice Isolator';
    default:
      return type;
  }
};

export const GenerationHistoryPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { history, removeFromHistory, clearHistory } = useGenerationHistory();

  const handleDownload = (item: any) => {
    try {
      const link = document.createElement('a');
      link.href = item.audioUrl;
      link.download = `voice-alchemy-${item.type}-${new Date(item.timestamp).toISOString()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download audio');
    }
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <Card className={`mt-6 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Generation History</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm('Are you sure you want to clear all history?')) {
              clearHistory();
            }
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {item.voiceName ? `${item.voiceName} • ` : ''}
                    {getTypeLabel(item.type)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground truncate">{item.input}</p>
                <div className="mt-2">
                  <AudioPlayer src={item.audioUrl} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDownload(item)}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeFromHistory(item.id)}
                  title="Remove from history"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
