import React from 'react';
import { Button } from './ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="absolute top-4 right-16 flex items-center rounded-md border overflow-hidden">
      <Button
        variant="ghost"
        size="sm"
        aria-label="Switch to English"
        onClick={() => setLanguage('en')}
        className={cn(
          "px-2 py-1 h-8 rounded-none",
          language === 'en' ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-muted'
        )}
        title="Switch to English"
      >
        <span className={cn("font-medium", language !== 'en' && "text-muted-foreground")}>EN</span>
      </Button>
      
      <div className="w-px h-4 bg-border mx-0.5"></div>
      
      <Button
        variant="ghost"
        size="sm"
        aria-label="Zu Deutsch wechseln"
        onClick={() => setLanguage('de')}
        className={cn(
          "px-2 py-1 h-8 rounded-none",
          language === 'de' ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-muted'
        )}
        title="Zu Deutsch wechseln"
      >
        <span className={cn("font-medium", language !== 'de' && "text-muted-foreground")}>DE</span>
      </Button>
    </div>
  );
}
