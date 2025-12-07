import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/Dropdown';

interface Platform {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  color: string;
}

interface PlatformSwitcherProps {
  className?: string;
  platforms?: Platform[];
  currentPlatformId?: string;
  onPlatformChange?: (platform: Platform) => void;
  showDomain?: boolean;
  align?: 'start' | 'center' | 'end';
}

const DEFAULT_PLATFORMS: Platform[] = [
  { 
    id: 'sos-expat', 
    name: 'SOS-Expat', 
    domain: 'sos-expat.com',
    color: '#3B82F6'
  },
  { 
    id: 'ulixai', 
    name: 'Ulixai', 
    domain: 'ulixai.com',
    color: '#8B5CF6'
  },
  { 
    id: 'ulysse', 
    name: 'Ulysse.AI', 
    domain: 'ulysse.ai',
    color: '#10B981'
  }
];

const STORAGE_KEY = 'current_platform';

function getStoredPlatform(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredPlatform(platformId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, platformId);
  } catch {
    // Ignore storage errors
  }
}

export function PlatformSwitcher({
  className,
  platforms = DEFAULT_PLATFORMS,
  currentPlatformId,
  onPlatformChange,
  showDomain = false,
  align = 'end'
}: PlatformSwitcherProps) {
  const { t } = useTranslation();
  
  const [selectedId, setSelectedId] = useState<string>(() => {
    return currentPlatformId || getStoredPlatform() || platforms[0]?.id || '';
  });

  const currentPlatform = platforms.find(p => p.id === selectedId) || platforms[0];

  // Sync with prop changes
  useEffect(() => {
    if (currentPlatformId && currentPlatformId !== selectedId) {
      setSelectedId(currentPlatformId);
    }
  }, [currentPlatformId, selectedId]);

  const handlePlatformChange = useCallback((platform: Platform) => {
    setSelectedId(platform.id);
    setStoredPlatform(platform.id);
    onPlatformChange?.(platform);
  }, [onPlatformChange]);

  if (!currentPlatform) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-2 min-w-[140px] justify-between', className)}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: currentPlatform.color }}
            />
            <span className="truncate">{currentPlatform.name}</span>
          </div>
          <ChevronDown size={14} className="flex-shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align={align} className="min-w-[200px]">
        <DropdownMenuLabel>
          {t('navigation.header.platforms', 'Plateformes')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {platforms.map(platform => (
          <DropdownMenuItem
            key={platform.id}
            onClick={() => handlePlatformChange(platform)}
            className={cn(
              'flex items-center gap-3 cursor-pointer',
              selectedId === platform.id && 'bg-slate-100'
            )}
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: platform.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{platform.name}</div>
              {showDomain && (
                <div className="text-xs text-slate-500 truncate">{platform.domain}</div>
              )}
            </div>
            {selectedId === platform.id && (
              <Check size={16} className="text-blue-600 flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook pour accéder à la plateforme courante
export function useCurrentPlatform() {
  const [platformId, setPlatformId] = useState<string>(() => {
    return getStoredPlatform() || DEFAULT_PLATFORMS[0]?.id || '';
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setPlatformId(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const platform = DEFAULT_PLATFORMS.find(p => p.id === platformId) || DEFAULT_PLATFORMS[0];

  return {
    platformId,
    platform,
    setPlatformId: (id: string) => {
      setPlatformId(id);
      setStoredPlatform(id);
    }
  };
}