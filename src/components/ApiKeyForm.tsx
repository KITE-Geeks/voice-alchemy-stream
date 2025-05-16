
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ElevenLabsAPI } from '@/api/elevenLabsApi';
import { toast } from '@/components/ui/sonner';
import { MicIcon } from 'lucide-react';

interface ApiKeyFormProps {
  onApiKeyValidated: (apiKey: string) => void;
}

const ApiKeyForm = ({ onApiKeyValidated }: ApiKeyFormProps) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast.error('Please enter your ElevenLabs API key');
      return;
    }
    
    setIsValidating(true);
    try {
      const api = new ElevenLabsAPI(apiKey);
      const isValid = await api.validateApiKey();
      
      if (isValid) {
        toast.success('API key validated successfully');
        onApiKeyValidated(apiKey);
      } else {
        toast.error('Invalid API key');
      }
    } catch (error) {
      toast.error('Error validating API key');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MicIcon className="h-6 w-6 gradient-bg text-white rounded-full p-1" />
          <CardTitle>ElevenLabs API</CardTitle>
        </div>
        <CardDescription>
          Enter your ElevenLabs API key to use the voice conversion service
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter your ElevenLabs API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
              disabled={isValidating}
            />
            <p className="text-xs text-muted-foreground">
              Don't have an API key? <a href="https://elevenlabs.io/app" target="_blank" rel="noreferrer" className="text-primary hover:underline">Get one here</a>
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full gradient-bg"
            disabled={isValidating}
          >
            {isValidating ? 'Validating...' : 'Connect API'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ApiKeyForm;
