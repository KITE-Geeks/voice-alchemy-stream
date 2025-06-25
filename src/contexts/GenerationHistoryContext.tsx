import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type GenerationType = 'text-to-speech' | 'speech-to-speech' | 'sound-fx' | 'voice-isolator';

export interface GenerationHistoryItem {
  id: string;
  type: GenerationType;
  timestamp: number;
  input: string;
  voiceName?: string;
  audioUrl: string;
  audioBlob?: Blob;
  model?: string;
  emotion?: string;
  soundEffect?: string;
}

interface GenerationHistoryContextType {
  history: GenerationHistoryItem[];
  addToHistory: (item: Omit<GenerationHistoryItem, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
}

const GenerationHistoryContext = createContext<GenerationHistoryContextType | undefined>(undefined);

const HISTORY_STORAGE_KEY = 'voiceAlchemyGenerationHistory';

export const GenerationHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<GenerationHistoryItem[]>([]);

  // Load history from sessionStorage on mount
  useEffect(() => {
    try {
      const savedHistory = sessionStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Failed to load generation history from sessionStorage', error);
    }
  }, []);

  // Save history to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save generation history to sessionStorage', error);
    }
  }, [history]);

  const addToHistory = (item: Omit<GenerationHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: GenerationHistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    setHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50 items
  };

  const removeFromHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <GenerationHistoryContext.Provider value={{ history, addToHistory, clearHistory, removeFromHistory }}>
      {children}
    </GenerationHistoryContext.Provider>
  );
};

export const useGenerationHistory = (): GenerationHistoryContextType => {
  const context = useContext(GenerationHistoryContext);
  if (context === undefined) {
    throw new Error('useGenerationHistory must be used within a GenerationHistoryProvider');
  }
  return context;
};
