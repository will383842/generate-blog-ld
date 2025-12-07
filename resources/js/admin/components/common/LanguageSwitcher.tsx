import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/Dropdown';
import { SUPPORTED_LANGUAGES, getLanguageDirection } from '@/i18n/languages';

interface LanguageSwitcherProps {
  className?: string;
  showLabel?: boolean;
  showFlag?: boolean;
  align?: 'start' | 'center' | 'end';
}

const STORAGE_KEY = 'admin_language';

function persistLanguage(langCode: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, langCode);
  } catch {
    // Ignore storage errors
  }
}

export function LanguageSwitcher({
  className,
  showLabel = false,
  showFlag = true,
  align = 'end'
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const languages = useMemo(() => Object.values(SUPPORTED_LANGUAGES), []);
  const currentLanguage = SUPPORTED_LANGUAGES[i18n.language] || SUPPORTED_LANGUAGES.fr;

  const handleLanguageChange = useCallback((langCode: string) => {
    i18n.changeLanguage(langCode);
    persistLanguage(langCode);

    // Update document lang and dir attributes
    if (typeof document !== 'undefined') {
      document.documentElement.lang = langCode;
      document.documentElement.dir = getLanguageDirection(langCode);
    }
  }, [i18n]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? 'sm' : 'icon'}
          className={cn('gap-2', className)}
        >
          {showFlag ? (
            <span className="text-lg leading-none">{currentLanguage.flag}</span>
          ) : (
            <Globe size={20} />
          )}
          {showLabel && (
            <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} className="min-w-[150px] max-h-[300px] overflow-y-auto">
        {languages.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn(
              'flex items-center gap-3 cursor-pointer',
              i18n.language === lang.code && 'bg-slate-100'
            )}
          >
            <span className="text-lg leading-none">{lang.flag}</span>
            <span className="flex-1">{lang.nativeName}</span>
            {i18n.language === lang.code && (
              <Check size={16} className="text-blue-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}