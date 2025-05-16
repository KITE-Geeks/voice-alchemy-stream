import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { NavTabs } from '../components/NavTabs';

export default function SoundFX() {
  const location = useLocation();
  const apiKey = location.state?.apiKey || '';
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Card className="w-full max-w-2xl">
        <CardContent className="py-8">
          <NavTabs />
          <h2 className="text-2xl font-bold mb-4 text-center">Sound FX</h2>
          <div className="text-muted-foreground mb-2 text-center">API Key: {apiKey ? 'Provided' : 'Missing'}</div>
          <div className="p-4 border rounded bg-muted text-center">Sound FX feature coming soon!</div>
        </CardContent>
      </Card>
    </div>
  );
} 