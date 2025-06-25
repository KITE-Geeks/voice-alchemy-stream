import { ThemeProvider, useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Button } from './components/ui/button';
import { Moon, Sun } from 'lucide-react';
import TextToSpeech from './pages/text-to-speech';
import SoundFX from './pages/sound-fx';
import VoiceIsolator from './pages/voice-isolator';
import SpeechToSpeech from './pages/speech-to-speech';
import { LanguageProvider } from './contexts/LanguageContext';
import { LanguageToggle } from './components/LanguageToggle';
import { GenerationHistoryProvider } from './contexts/GenerationHistoryContext';

const queryClient = new QueryClient();

// Get the base URL from Vite's environment
const baseUrl = import.meta.env.BASE_URL;

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="absolute top-4 right-4"
    >
      {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <GenerationHistoryProvider>
            <Toaster />
            <Sonner />
            <ThemeToggle />
            <LanguageToggle />
            <BrowserRouter basename={baseUrl}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/text-to-speech" element={<TextToSpeech />} />
                <Route path="/speech-to-speech" element={<SpeechToSpeech />} />
                <Route path="/sound-fx" element={<SoundFX />} />
                <Route path="/voice-isolator" element={<VoiceIsolator />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </GenerationHistoryProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
