import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

const tabs = [
  { key: 'text-to-speech', label: 'Text-to-Speech', path: '/text-to-speech' },
  { key: 'speech-to-speech', label: 'Speech-to-Speech', path: '/speech-to-speech' },
  { key: 'sound-fx', label: 'Sound FX', path: '/sound-fx' },
  { key: 'speech-to-text', label: 'Speech-to-Text', path: '/speech-to-text' },
];

export function NavTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const apiKey = location.state?.apiKey || '';
  const currentPath = location.pathname;

  const handleTabClick = (tab) => {
    if (currentPath !== tab.path) {
      navigate(tab.path, { state: { apiKey } });
    }
  };

  return (
    <div className="flex gap-2 mb-6 justify-center">
      {tabs.map(tab => (
        <Button
          key={tab.key}
          variant={currentPath === tab.path ? 'default' : 'outline'}
          className="rounded-full px-4 py-1 text-sm"
          onClick={() => handleTabClick(tab)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
} 