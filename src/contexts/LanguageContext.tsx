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
    'text_to_speech.stability_description': 'Higher values will make the voice more stable and consistent, but may lose some expressiveness.',
    'text_to_speech.similarity_boost': 'Similarity Boost',
    'text_to_speech.similarity_boost_description': 'Enhances the similarity to the original voice. Higher values make the generated voice more similar to the selected voice.',
    'text_to_speech.generate_audio': 'Generate Audio',
    'text_to_speech.download_generated': 'Download Generated Audio',
    'text_to_speech.vocal_delivery': 'Vocal Delivery',
    'text_to_speech.audio_effect': 'Audio Effect',
    'text_to_speech.select_vocal_expression': 'Select vocal expression',
    'text_to_speech.select_audio_effect': 'Select audio effect',
    'text_to_speech.no_effect': 'No effect',
    'text_to_speech.use_v3_model': 'Use v3 Model (Experimental)',
    'text_to_speech.advanced_settings': 'Advanced Settings',
    'text_to_speech.vocal_delivery_description': 'Add expressive tags to modify speech delivery',
    'text_to_speech.audio_effect_description': 'Apply special audio effects to the generated speech',
    'text_to_speech.example_tags_description': 'These are example tags - feel free to experiment with different combinations to achieve your desired voice effect.',
    
    // Vocal Delivery Options
    'text_to_speech.vocal_delivery_laughs': 'Laughs',
    'text_to_speech.vocal_delivery_sighs': 'Sighs',
    'text_to_speech.vocal_delivery_yawns': 'Yawns',
    'text_to_speech.vocal_delivery_gasps': 'Gasps',
    'text_to_speech.vocal_delivery_clears_throat': 'Clears Throat',
    'text_to_speech.vocal_delivery_whispers': 'Whispers',
    'text_to_speech.vocal_delivery_excited': 'Excited',
    'text_to_speech.vocal_delivery_sad': 'Sad',
    'text_to_speech.vocal_delivery_angry': 'Angry',
    'text_to_speech.vocal_delivery_happy': 'Happy',
    'text_to_speech.vocal_delivery_sarcastic': 'Sarcastic',
    'text_to_speech.vocal_delivery_serious': 'Serious',
    'text_to_speech.vocal_delivery_singing': 'Singing',
    'text_to_speech.vocal_delivery_mumbling': 'Mumbling',
    'text_to_speech.vocal_delivery_shouting': 'Shouting',
    'text_to_speech.vocal_delivery_crying': 'Crying',
    'text_to_speech.vocal_delivery_laughing': 'Laughing',
    'text_to_speech.vocal_delivery_whistling': 'Whistling',
    'text_to_speech.vocal_delivery_yawning': 'Yawning',
    'text_to_speech.vocal_delivery_giggles': 'Giggles',
    'text_to_speech.vocal_delivery_sniffles': 'Sniffles',
    'text_to_speech.vocal_delivery_snores': 'Snores',
    'text_to_speech.vocal_delivery_gulps': 'Gulps',
    
    // Sound Effects
    'text_to_speech.sound_effect_echo': 'Echo',
    'text_to_speech.sound_effect_reverb': 'Reverb',
    'text_to_speech.sound_effect_chorus': 'Chorus',
    'text_to_speech.sound_effect_flanger': 'Flanger',
    'text_to_speech.sound_effect_telephone': 'Telephone',
    'text_to_speech.sound_effect_radio': 'Radio',
    'text_to_speech.sound_effect_underwater': 'Underwater',
    'text_to_speech.sound_effect_megaphone': 'Megaphone',
    'text_to_speech.sound_effect_robot': 'Robot',
    'text_to_speech.sound_effect_alien': 'Alien',
    'text_to_speech.sound_effect_helium': 'Helium',
    'text_to_speech.sound_effect_slow_motion': 'Slow Motion',
    'text_to_speech.sound_effect_fast_forward': 'Fast Forward',
    'text_to_speech.sound_effect_vintage_radio': 'Vintage Radio',
    'text_to_speech.sound_effect_dark_whisper': 'Dark Whisper',
    
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
    'text_to_speech.generate_audio': 'Audio generieren',
    'text_to_speech.stability': 'Stabilität',
    'text_to_speech.stability_description': 'Kontrolliert, wie stabil die Sprachgenerierung ist. Höhere Werte erzeugen konsistentere Ergebnisse.',
    'text_to_speech.similarity_boost': 'Ähnlichkeits-Boost',
    'text_to_speech.similarity_boost_description': 'Verstärkt die Ähnlichkeit zur ursprünglichen Stimme. Höhere Werte machen die generierte Stimme ähnlicher zur ausgewählten Stimme.',
    'text_to_speech.vocal_delivery': 'Stimmausdruck',
    'text_to_speech.audio_effect': 'Audioeffekt',
    'text_to_speech.select_vocal_expression': 'Stimmausdruck auswählen',
    'text_to_speech.select_audio_effect': 'Audioeffekt auswählen',
    'text_to_speech.no_effect': 'Kein Effekt',
    'text_to_speech.use_v3_model': 'V3-Modell verwenden (Experimentell)',
    'text_to_speech.advanced_settings': 'Erweiterte Einstellungen',
    'text_to_speech.vocal_delivery_description': 'Füge Ausdrucks-Tags hinzu, um die Sprachwiedergabe zu verändern',
    'text_to_speech.audio_effect_description': 'Wende spezielle Audioeffekte auf die generierte Sprache an',
    'text_to_speech.example_tags_description': 'Das sind nur Beispiel-Tags - experimentiere gerne mit verschiedenen Anweisungen, Kombinationen und Sound-Effekten, um den gewünschten Stimmeffekt zu erzielen.',
    'text_to_speech.text_placeholder': 'Gib deinen Text hier ein oder füge ihn ein...',
    'text_to_speech.download_generated': 'Generiertes Audio herunterladen',
    
    // Vocal Delivery Options
    'text_to_speech.vocal_delivery_laughs': 'Lacht',
    'text_to_speech.vocal_delivery_sighs': 'Seufzt',
    'text_to_speech.vocal_delivery_yawns': 'Gähnt',
    'text_to_speech.vocal_delivery_gasps': 'Keucht',
    'text_to_speech.vocal_delivery_clears_throat': 'Räuspert sich',
    'text_to_speech.vocal_delivery_whispers': 'Flüstert',
    'text_to_speech.vocal_delivery_excited': 'Aufgeregt',
    'text_to_speech.vocal_delivery_sad': 'Traurig',
    'text_to_speech.vocal_delivery_angry': 'Wütend',
    'text_to_speech.vocal_delivery_happy': 'Glücklich',
    'text_to_speech.vocal_delivery_sarcastic': 'Sarkastisch',
    'text_to_speech.vocal_delivery_serious': 'Ernst',
    'text_to_speech.vocal_delivery_singing': 'Singend',
    'text_to_speech.vocal_delivery_mumbling': 'Murmelnd',
    'text_to_speech.vocal_delivery_shouting': 'Schreiend',
    'text_to_speech.vocal_delivery_crying': 'Weinend',
    'text_to_speech.vocal_delivery_laughing': 'Lachend',
    'text_to_speech.vocal_delivery_whistling': 'Pfeifend',
    'text_to_speech.vocal_delivery_yawning': 'Gähnend',
    'text_to_speech.vocal_delivery_giggles': 'Kichert',
    'text_to_speech.vocal_delivery_sniffles': 'Schnüffelt',
    'text_to_speech.vocal_delivery_snores': 'Schnarcht',
    'text_to_speech.vocal_delivery_gulps': 'Schluckt',
    
    // Sound Effects
    'text_to_speech.sound_effect_echo': 'Echo',
    'text_to_speech.sound_effect_reverb': 'Hall',
    'text_to_speech.sound_effect_chorus': 'Chor',
    'text_to_speech.sound_effect_flanger': 'Flanger',
    'text_to_speech.sound_effect_telephone': 'Telefon',
    'text_to_speech.sound_effect_radio': 'Radio',
    'text_to_speech.sound_effect_underwater': 'Unterwasser',
    'text_to_speech.sound_effect_megaphone': 'Megafon',
    'text_to_speech.sound_effect_robot': 'Roboter',
    'text_to_speech.sound_effect_alien': 'Alien',
    'text_to_speech.sound_effect_helium': 'Helium',
    'text_to_speech.sound_effect_slow_motion': 'Zeitlupe',
    'text_to_speech.sound_effect_fast_forward': 'Schnellvorlauf',
    'text_to_speech.sound_effect_vintage_radio': 'Vintage Radio',
    'text_to_speech.sound_effect_dark_whisper': 'Dunkles Flüstern',
    
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
    const languageTranslations = translations[language];
    let translatedText = (languageTranslations as any)[key] || key;
    
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
