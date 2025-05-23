import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { elevenlabsApi } from '@/api/elevenlabsApi.unified';

const features = [
  { key: 'text-to-speech', label: 'Text to Speech' },
  { key: 'speech-to-speech', label: 'Speech to Speech' },
  { key: 'sound-fx', label: 'Sound FX' },
  { key: 'speech-to-text', label: 'Speech to Text' },
];

export default function Index() {
  const [apiKey, setApiKey] = useState('');
  const [validated, setValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const passedApiKey = location.state?.apiKey || '';

  const handleValidate = async () => {
    setLoading(true);
    try {
      await elevenlabsApi.getVoices(apiKey);
      setValidated(true);
      toast.success('API key validated!');
    } catch {
      toast.error('Invalid API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureSelect = (feature: string) => {
    navigate(`/${feature}`, { state: { apiKey: apiKey || passedApiKey } });
  };

  // If already validated or coming from another page, show selector
  const showSelector = validated || passedApiKey;
  const effectiveApiKey = apiKey || passedApiKey;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="py-8">
          <h1 className="text-2xl font-bold mb-4 text-center">Voice Alchemy</h1>
          {!showSelector ? (
            <>
              <Input
                type="password"
                placeholder="Enter ElevenLabs API Key"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="mb-4"
              />
              <Button onClick={handleValidate} className="w-full" disabled={loading}>
                {loading ? 'Validating...' : 'Validate API Key'}
              </Button>
            </>
          ) : (
            <>
              <div className="mb-4 text-center text-muted-foreground">Select a feature:</div>
              <div className="flex flex-col gap-3">
                {features.map(f => (
                  <Button key={f.key} className="w-full" onClick={() => handleFeatureSelect(f.key)}>
                    {f.label}
                  </Button>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
