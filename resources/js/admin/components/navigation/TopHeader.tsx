import { useTranslation } from 'react-i18next';
import { Bell, Globe, ChevronDown, User, LogOut, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileMenu } from './MobileMenu';
import { SearchGlobal } from './SearchGlobal';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/Dropdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { changeLanguage } from '@/i18n/config';

interface TopHeaderProps {
  className?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    initials: string;
  };
  platforms?: Array<{ id: string; name: string }>;
  currentPlatform?: string;
  onPlatformChange?: (platformId: string) => void;
  notifications?: Array<{
    id: string | number;
    title: string;
    message: string;
    time: string;
    read: boolean;
  }>;
  onNotificationClick?: (id: string | number) => void;
  onMarkAllRead?: () => void;
  onLogout?: () => void;
}

const DEFAULT_USER = {
  name: 'Williams Jullin',
  email: 'admin@sos-expat.com',
  initials: 'WJ'
};

const DEFAULT_PLATFORMS = [
  { id: 'sos-expat', name: 'SOS-Expat.com' },
  { id: 'ulixai', name: 'Ulixai.com' },
  { id: 'ulysse', name: 'Ulysse.AI' }
];

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' }
] as const;

export function TopHeader({
  className,
  user = DEFAULT_USER,
  platforms = DEFAULT_PLATFORMS,
  currentPlatform = 'sos-expat',
  onPlatformChange,
  notifications = [],
  onNotificationClick,
  onMarkAllRead,
  onLogout
}: TopHeaderProps) {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;
  const unreadCount = notifications.filter(n => !n.read).length;
  const currentPlatformData = platforms.find(p => p.id === currentPlatform);

  const handleLanguageChange = (langCode: string) => {
    changeLanguage(langCode as 'fr' | 'en');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex items-center h-16 px-4 bg-white border-b border-slate-200 gap-4',
        className
      )}
    >
      {/* Mobile Menu */}
      <MobileMenu />

      {/* Search */}
      <div className="flex-1 max-w-xl">
        <SearchGlobal />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Platform Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:flex gap-2">
              <Globe size={16} />
              <span>{currentPlatformData?.name || 'Plateforme'}</span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Plateformes</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {platforms.map(platform => (
              <DropdownMenuItem
                key={platform.id}
                onClick={() => onPlatformChange?.(platform.id)}
                className={cn(platform.id === currentPlatform && 'bg-slate-100')}
              >
                {platform.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <span className="text-lg">
                {LANGUAGES.find(l => l.code === currentLanguage)?.flag || '🌐'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('navigation.header.language')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LANGUAGES.map(lang => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={cn(currentLanguage === lang.code && 'bg-slate-100')}
              >
                <span className="mr-2">{lang.flag}</span>
                {lang.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              {t('navigation.header.notifications')}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllRead}
                  className="h-6 text-xs text-blue-600"
                >
                  {t('common.actions.clear')}
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">
                {t('common.messages.noData')}
              </div>
            ) : (
              notifications.slice(0, 5).map(notif => (
                <DropdownMenuItem
                  key={notif.id}
                  onClick={() => onNotificationClick?.(notif.id)}
                  className={cn(
                    'flex flex-col items-start gap-1 p-3 cursor-pointer',
                    !notif.read && 'bg-blue-50'
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium text-sm">{notif.title}</span>
                    {!notif.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                    <span className="ml-auto text-xs text-slate-400">{notif.time}</span>
                  </div>
                  <span className="text-xs text-slate-500">{notif.message}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <Button variant="ghost" size="icon" className="hidden md:flex">
          <HelpCircle size={20} />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <span className="hidden md:block">{user.name.split(' ')[0]}</span>
              <ChevronDown size={14} className="hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user.name}</span>
                <span className="text-xs text-slate-500 font-normal">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User size={16} className="mr-2" />
              {t('navigation.header.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings size={16} className="mr-2" />
              {t('navigation.header.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-red-600">
              <LogOut size={16} className="mr-2" />
              {t('navigation.header.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}