import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const tabKeys = [
  { key: 'text-to-speech', translationKey: 'nav.text_to_speech', path: '/text-to-speech' },
  { key: 'speech-to-speech', translationKey: 'nav.speech_to_speech', path: '/speech-to-speech' },
  { key: 'sound-fx', translationKey: 'nav.sound_fx', path: '/sound-fx' },
  { key: 'voice-isolator', translationKey: 'nav.voice_isolator', path: '/voice-isolator' },
];

interface NavTabsProps {
  activeTab?: string;
  apiKey?: string;
}

export function NavTabs({ activeTab, apiKey: propApiKey }: NavTabsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const locationApiKey = location.state?.apiKey || '';
  const apiKey = propApiKey || locationApiKey || '';
  const currentPath = location.pathname;

  const handleTabClick = (tab) => {
    if (currentPath !== tab.path) {
      navigate(tab.path, { state: { apiKey } });
    }
  };

  return (
    <div className="flex gap-2 mb-6 justify-center">
      {tabKeys.map(tab => (
        <Button
          key={tab.key}
          variant={(activeTab === tab.key || (!activeTab && currentPath === tab.path)) ? 'default' : 'outline'}
          className="rounded-full px-4 py-1 text-sm"
          onClick={() => handleTabClick(tab)}
        >
          {t(tab.translationKey)}
        </Button>
      ))}
    </div>
  );
} 