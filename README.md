# Voice Alchemy Stream

## Project info
A simple frontend that gives access to Elevenlabs features when providing it with a valid API-key. 
Meant for sharing access without compromising your account.

## Currently functional features:

- Text-to-Speech: Convert written text to spoken audio using ElevenLabs voices
- Speech-to-Speech: Convert audio recordings to different voices
- Sound Effects: Generate sound effects based on text prompts

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- ElevenLabs API

## Codebase Architecture

### Directory Structure

- `/src/api`: API client implementations for ElevenLabs
- `/src/components`: Reusable React components
- `/src/pages`: Main application pages/features
- `/src/types`: TypeScript type definitions
- `/src/utils`: Utility functions and helpers

### Key Features

- **Unified API Implementation**: All ElevenLabs API interactions are centralized in the `elevenlabsApi.unified.ts` file, providing both class-based and functional access patterns.
- **Type Safety**: Comprehensive TypeScript types for all API responses and parameters.
- **Local Storage Management**: Centralized storage utilities in `utils/storage.ts` for consistent data persistence.
- **Responsive UI**: Modern, responsive interface built with shadcn-ui components.

### Recent Improvements

- **Consolidated API Implementation**: Combined functional and class-based API implementations into a single unified approach.
- **Centralized Type Definitions**: Moved all types to dedicated type files for better organization.
- **Storage Utilities**: Created reusable storage utilities to standardize localStorage interactions.
- **Consistent Import Paths**: Standardized import paths using the `@/` prefix for better maintainability.
- **Code Cleanup**: Removed duplicate code and unused files to improve maintainability.


