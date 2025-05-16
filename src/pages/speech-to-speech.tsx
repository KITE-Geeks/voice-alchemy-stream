import { useLocation } from 'react-router-dom';

export default function SpeechToSpeech() {
  const location = useLocation();
  const apiKey = location.state?.apiKey || '';
  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Speech to Speech</h2>
      <div className="text-muted-foreground mb-2">API Key: {apiKey ? 'Provided' : 'Missing'}</div>
      <div className="p-4 border rounded bg-muted">Speech-to-Speech feature coming soon!</div>
    </div>
  );
} 