# Voice Alchemy Stream

## Project Info
A secure frontend interface for ElevenLabs' voice synthesis features, designed to safely share API access without compromising your account credentials.

## Features

### Text-to-Speech
- Convert written text to natural-sounding speech
- Support for multiple voices and languages
- **Upcoming V3 Model Support** (pending ElevenLabs API release)
  - Enhanced emotional range and expressiveness
  - Advanced vocal delivery customization (laughs, sighs, whispers, etc.)
  - Built-in audio effects (echo, reverb, chorus, etc.)

### Speech-to-Speech
- Convert audio recordings to different voices
- Maintain natural speech patterns and intonation

### Sound Effects
- Generate sound effects from text prompts
- Multiple effect variations
- Real-time preview

### Voice Isolator
- Remove background noise from audio recordings
- Enhance voice clarity
- Support for various audio formats

## Technologies

- ⚡ Vite - Next Generation Frontend Tooling
- 🎨 React 18 with TypeScript
- 🖥️ shadcn/ui - Beautifully designed components
- 🎨 Tailwind CSS - Utility-first CSS framework
- 🚀 ElevenLabs API - Industry-leading voice synthesis
- 🌐 i18n - Multi-language support (English & German)

## Project Structure

```
src/
├── api/               # API client implementations
├── components/         # Reusable UI components
├── contexts/           # React context providers
│   ├── GenerationHistoryContext.tsx
│   └── LanguageContext.tsx
├── pages/              # Main application pages
│   ├── Index.tsx
│   ├── text-to-speech.tsx
│   ├── speech-to-speech.tsx
│   ├── sound-fx.tsx
│   └── voice-isolator.tsx
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
    └── storage.ts      # Local storage management
```

## Key Features

### Technical Highlights
- **Unified API Layer**: Centralized API client with consistent error handling
- **Type Safety**: Comprehensive TypeScript integration
- **State Management**: React Context for global state
- **Responsive Design**: Mobile-first, fully responsive UI
- **i18n Support**: Built-in internationalization
- **Persistent Storage**: User preferences and history saved locally

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with your ElevenLabs API key:
   ```
   VITE_ELEVENLABS_API_KEY=your_api_key_here
   ```
4. Start the development server: `npm run dev`
5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Contributing

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes and commit them
3. Push to the branch: `git push origin feature/your-feature`
4. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

