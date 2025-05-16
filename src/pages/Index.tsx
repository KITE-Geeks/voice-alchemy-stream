
import { useState } from 'react';
import ApiKeyForm from '@/components/ApiKeyForm';
import VoiceConverter from '@/components/VoiceConverter';
import { Toaster } from '@/components/ui/sonner';

const Index = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);

  const handleApiKeyValidated = (key: string) => {
    setApiKey(key);
  };

  return (
    <div className="app-container">
      <header className="py-6 mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Voice Transformer</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Transform your voice into anyone else's using ElevenLabs AI technology
        </p>
      </header>
      
      <main className="flex-1">
        {!apiKey ? (
          <ApiKeyForm onApiKeyValidated={handleApiKeyValidated} />
        ) : (
          <VoiceConverter apiKey={apiKey} />
        )}
      </main>
      
      <footer className="mt-12 py-4 text-center text-sm text-muted-foreground">
        <p>Powered by ElevenLabs API</p>
      </footer>
    </div>
  );
};

export default Index;
