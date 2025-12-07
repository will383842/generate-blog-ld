import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ChevronDown,
  Shield,
  CreditCard,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from '@/components/ui/Dropdown';

interface UserData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  role: string;
}

interface UserMenuProps {
  className?: string;
  user?: UserData;
  showRole?: boolean;
  showChevron?: boolean;
  onLogout?: () => void;
  align?: 'start' | 'center' | 'end';
}

const DEFAULT_USER: UserData = {
  id: '1',
  name: 'Williams Jullin',
  email: 'admin@sos-expat.com',
  initials: 'WJ',
  role: 'Administrateur'
};

const ROLE_COLORS: Record<string, string> = {
  'Administrateur': 'text-red-600 bg-red-50',
  'Admin': 'text-red-600 bg-red-50',
  'Éditeur': 'text-blue-600 bg-blue-50',
  'Editor': 'text-blue-600 bg-blue-50',
  'Auteur': 'text-green-600 bg-green-50',
  'Author': 'text-green-600 bg-green-50',
  'Lecteur': 'text-slate-600 bg-slate-50',
  'Viewer': 'text-slate-600 bg-slate-50'
};

export function UserMenu({
  className,
  user = DEFAULT_USER,
  showRole = true,
  showChevron = true,
  onLogout,
  align = 'end'
}: UserMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    onLogout?.();
  }, [onLogout]);

  const roleColor = ROLE_COLORS[user.role] || 'text-slate-600 bg-slate-50';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2 px-2', className)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-xs font-medium">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start">
            <span className="text-sm font-medium leading-none">
              {user.name.split(' ')[0]}
            </span>
            {showRole && (
              <span className="text-xs text-slate-500 leading-none mt-0.5">
                {user.role}
              </span>
            )}
          </div>
          {showChevron && (
            <ChevronDown size={14} className="hidden md:block opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align={align} className="w-56">
        {/* User info header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-slate-500">{user.email}</p>
              <span className={cn('text-xs px-1.5 py-0.5 rounded w-fit mt-1', roleColor)}>
                {user.role}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Navigation items */}
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={() => handleNavigate('/profile')}
            className="cursor-pointer"
          >
            <User size={16} className="mr-2" />
            {t('navigation.header.profile')}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleNavigate('/settings')}
            className="cursor-pointer"
          >
            <Settings size={16} className="mr-2" />
            {t('navigation.header.settings')}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleNavigate('/settings/notifications')}
            className="cursor-pointer"
          >
            <Bell size={16} className="mr-2" />
            {t('settings.general.notifications.title', 'Notifications')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={() => handleNavigate('/billing')}
            className="cursor-pointer"
          >
            <CreditCard size={16} className="mr-2" />
            {t('navigation.header.billing', 'Facturation')}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => handleNavigate('/admin')}
            className="cursor-pointer"
          >
            <Shield size={16} className="mr-2" />
            {t('navigation.sections.admin')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => window.open('/docs', '_blank')}
          className="cursor-pointer"
        >
          <HelpCircle size={16} className="mr-2" />
          {t('navigation.header.help')}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Logout */}
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut size={16} className="mr-2" />
          {t('navigation.header.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}