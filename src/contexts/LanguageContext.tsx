import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'en' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.select_feature': 'Select a feature:',
    'common.download': 'Download',
    'common.play': 'Play',
    'common.pause': 'Pause',
    'common.clear': 'Clear',
    'common.generating': 'Generating...',
    'common.processing': 'Processing...',
    'common.converting': 'Converting...',
    'common.upload': 'Upload',
    'common.record': 'Record',
    'common.cost': 'Cost:',
    'common.credits': 'credits',
    'common.original_audio': 'Original Audio',
    'common.generated_audio': 'Generated Audio',
    'common.converted_audio': 'Converted Audio',
    'common.processed_audio': 'Processed Audio',
    'common.upload_audio_file': 'Upload Audio File',
    'common.upload_audio_format': 'Upload an MP3, WAV or other audio format',
    'common.max_size': 'max 10MB',
    'common.select_voice': 'Select Voice',
    'common.loading_voices': 'Loading voices...',
    'common.start_recording': 'Start Recording',
    'common.stop_recording': 'Stop Recording',

    // Navigation Tabs
    'nav.text_to_speech': 'Text-to-Speech',
    'nav.speech_to_speech': 'Speech-to-Speech',
    'nav.sound_fx': 'Sound FX',
    'nav.voice_isolator': 'Voice Isolator',
    
    // Abbreviations
    'common.eg': 'e.g.',

    // Voice Isolator
    'voice_isolator.title': 'Voice Isolator',
    'voice_isolator.how_it_works': 'How it works',
    'voice_isolator.description': 'Upload an audio file to isolate the voice and remove background noise. This tool uses ElevenLabs\' AI to separate voices from other sounds.',
    'voice_isolator.warning': 'WARNING: Results are recognized as "AI-generated"!!!',
    'voice_isolator.here': 'here',
    'voice_isolator.audio_input': 'Audio Input',
    'voice_isolator.upload_audio': 'Upload Audio',
    'voice_isolator.isolate_voice': 'Isolate Voice',
    'voice_isolator.download': 'Download Isolated Audio',
    'voice_isolator.processing': 'Processing...',
    'voice_isolator.clear': 'Clear',
    'voice_isolator.cost': 'Cost: {0} credits',
    
    // Text to Speech
    'text_to_speech.title': 'Text to Speech',
    'text_to_speech.enter_text': 'Enter Text',
    'text_to_speech.text_placeholder': 'Type or paste your text here...',
    'text_to_speech.stability': 'Stability',
    'text_to_speech.similarity_boost': 'Similarity Boost',
    'text_to_speech.stability_description': 'Higher values will make the voice more stable and consistent, but may lose some expressiveness.',
    'text_to_speech.similarity_description': 'Higher values will make the voice more similar to the original voice, but may reduce quality.',
    'text_to_speech.generate_audio': 'Generate Audio',
    'text_to_speech.download_generated': 'Download Generated Audio',
    
    // Speech to Speech
    'speech_to_speech.title': 'Speech to Speech Converter',
    'speech_to_speech.audio_input': 'Audio Input',
    'speech_to_speech.stability': 'Stability',
    'speech_to_speech.similarity_boost': 'Similarity Boost',
    'speech_to_speech.convert': 'Convert',
    'speech_to_speech.download_converted': 'Download Converted Audio',
    'speech_to_speech.cost': 'Cost: {0} credits',
    
    // Sound FX
    'sound_fx.title': 'Sound Effects Generator',
    'sound_fx.prompt_label': 'Describe the sound effect you want to generate',
    'sound_fx.prompt_placeholder': 'Describe the sound effect you want to generate (e.g., \'Cinematic Braam, Horror\' or \'Rain falling on a tin roof\')',
    'sound_fx.duration': 'Duration',
    'sound_fx.auto': 'Auto',
    'sound_fx.prompt_adherence': 'Prompt Adherence',
    'sound_fx.variations': 'Number of Variations',
    'sound_fx.generate': 'Generate Sound Effect',
    'sound_fx.current_generation': 'Current Generation',
    'sound_fx.history': 'History',
    'sound_fx.show_history': 'Show History',
    'sound_fx.hide_history': 'Hide History',
    'sound_fx.no_history': 'No historical sound effects',
    'sound_fx.variation': 'Variation',
  },
  de: {
    // Common
    'common.loading': 'Wird geladen...',
    'common.select_feature': 'Wählen Sie eine Funktion:',
    'common.download': 'Herunterladen',
    'common.play': 'Abspielen',
    'common.pause': 'Pause',
    'common.clear': 'Löschen',
    'common.generating': 'Wird generiert...',
    'common.processing': 'Wird verarbeitet...',
    'common.converting': 'Wird konvertiert...',
    'common.upload': 'Hochladen',
    'common.record': 'Aufnehmen',
    'common.cost': 'Kosten:',
    'common.credits': 'Credits',
    'common.original_audio': 'Original-Audio',
    'common.generated_audio': 'Generiertes Audio',
    'common.converted_audio': 'Konvertiertes Audio',
    'common.processed_audio': 'Verarbeitetes Audio',
    'common.upload_audio_file': 'Audio-Datei hochladen',
    'common.upload_audio_format': 'Lade eine MP3-, WAV- oder andere Audiodatei hoch',
    'common.max_size': 'max. 10MB',
    'common.select_voice': 'Stimme auswählen',
    'common.loading_voices': 'Stimmen werden geladen...',
    'common.start_recording': 'Aufnahme starten',
    'common.stop_recording': 'Aufnahme stoppen',

    // Navigation Tabs
    'nav.text_to_speech': 'Text-zu-Sprache',
    'nav.speech_to_speech': 'Sprache-zu-Sprache',
    'nav.sound_fx': 'Soundeffekte',
    'nav.voice_isolator': 'Stimmen-Isolator',
    
    // Abbreviations
    'common.eg': 'z.B.',
    
    // Voice Isolator
    'voice_isolator.title': 'Stimmen-Isolator',
    'voice_isolator.how_it_works': 'Wie es funktioniert',
    'voice_isolator.description': 'Audio-Datei hochladen, um die Stimme zu isolieren und Hintergrundgeräusche zu entfernen. Dieses Tool verwendet ElevenLabs\' AI, um Stimmen von anderen Geräuschen zu trennen.',
    'voice_isolator.warning': 'WARNUNG: Ergebnisse werden als "KI-generiert" erkannt!',
    'voice_isolator.here': 'hier',
    'voice_isolator.audio_input': 'Audio-Eingabe',
    'voice_isolator.upload_audio': 'Audio hochladen',
    'voice_isolator.isolate_voice': 'Stimme isolieren',
    'voice_isolator.download': 'Isolierte Audio herunterladen',
    'voice_isolator.processing': 'Wird verarbeitet...',
    'voice_isolator.clear': 'Löschen',
    'voice_isolator.cost': 'Kosten: {0} Credits',
    
    // Text to Speech
    'text_to_speech.title': 'Text zu Sprache',
    'text_to_speech.enter_text': 'Text eingeben',
    'text_to_speech.text_placeholder': 'Gib deinen Text hier ein oder füge ihn ein...',
    'text_to_speech.stability': 'Stabilität',
    'text_to_speech.similarity_boost': 'Ähnlichkeits-Boost',
    'text_to_speech.stability_description': 'Höhere Werte machen die Stimme stabiler und konsistenter, können aber Ausdruckskraft verlieren.',
    'text_to_speech.similarity_description': 'Höhere Werte machen die Stimme ähnlicher zur Originalstimme, können aber die Qualität reduzieren.',
    'text_to_speech.generate_audio': 'Audio generieren',
    'text_to_speech.download_generated': 'Generiertes Audio herunterladen',
    
    // Speech to Speech
    'speech_to_speech.title': 'Sprache-zu-Sprache-Konverter',
    'speech_to_speech.audio_input': 'Audio-Eingabe',
    'speech_to_speech.stability': 'Stabilität',
    'speech_to_speech.similarity_boost': 'Ähnlichkeits-Boost',
    'speech_to_speech.convert': 'Konvertieren',
    'speech_to_speech.download_converted': 'Konvertiertes Audio herunterladen',
    'speech_to_speech.cost': 'Kosten: {0} Credits',
    
    // Sound FX
    'sound_fx.title': 'Soundeffekt-Generator',
    'sound_fx.prompt_label': 'Beschreibe den gewünschten Soundeffekt (bitte auf Englisch)',
    'sound_fx.prompt_placeholder': 'Beschreibe den Soundeffekt auf Englisch, den du generieren möchtest (z.B. "Cinematic Braam, Horror" oder "Rain falling on a tin roof")',
    'sound_fx.english_note': 'Hinweis: Für beste Ergebnisse sollten Prompts auf Englisch eingegeben werden.',
    'sound_fx.duration': 'Dauer',
    'sound_fx.auto': 'Auto',
    'sound_fx.prompt_adherence': 'Prompt-Einhaltung',
    'sound_fx.variations': 'Anzahl der Variationen',
    'sound_fx.generate': 'Soundeffekt generieren',
    'sound_fx.current_generation': 'Aktuelle Generierung',
    'sound_fx.history': 'Verlauf',
    'sound_fx.show_history': 'Verlauf anzeigen',
    'sound_fx.hide_history': 'Verlauf ausblenden',
    'sound_fx.no_history': 'Keine historischen Soundeffekte',
    'sound_fx.variation': 'Variation',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Try to get language from localStorage, default to 'en'
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('preferred_language');
    return (savedLanguage === 'en' || savedLanguage === 'de') ? savedLanguage : 'en';
  });

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translatedText = translations[language][key as keyof typeof translations[typeof language]] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translatedText = translatedText.replace(`{${paramKey}}`, String(paramValue));
      });
    }
    
    return translatedText;
  };

  // Save language preference to localStorage when it changes
  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('preferred_language', newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
