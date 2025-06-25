import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { elevenlabsApi } from '@/api/elevenlabsApi.unified';

export default function Index() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const passedApiKey = location.state?.apiKey || '';

  // If we already have an API key, navigate to text-to-speech
  useEffect(() => {
    if (passedApiKey) {
      navigate('/text-to-speech', { state: { apiKey: passedApiKey } });
    }
  }, [passedApiKey, navigate]);

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }
    
    setLoading(true);
    try {
      await elevenlabsApi.getVoices(apiKey);
      toast.success('API key validated!');
      navigate('/text-to-speech', { state: { apiKey } });
    } catch {
      toast.error('Invalid API key. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="py-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Voice Alchemy</h1>
          <div className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="Enter ElevenLabs API Key"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full"
                autoFocus
              />
              <p className="text-sm text-muted-foreground mt-2">
                Your API key is only used locally and never stored on our servers.
              </p>
            </div>
            <Button 
              onClick={handleValidate} 
              className="w-full" 
              disabled={loading || !apiKey.trim()}
            >
              {loading ? 'Validating...' : 'Continue to Voice Alchemy'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
