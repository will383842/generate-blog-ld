/**
 * Sidebar Component
 * Complete sidebar with header (logo), menu, and footer (user profile)
 * 
 * Features:
 * - Collapsible mode
 * - Platform quick switcher
 * - User profile dropdown
 * - Real-time status indicator
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  Monitor,
  Building2,
  Check,
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/DropdownMenu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { SidebarMenu } from './SidebarMenu';
import { PLATFORMS, Platform } from '@/types/stats';

// ============================================================================
// Types
// ============================================================================

interface SidebarProps {
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

// ============================================================================
// Platform Selector
// ============================================================================

interface PlatformSelectorProps {
  currentPlatform: Platform | 'all';
  onPlatformChange: (platform: Platform | 'all') => void;
  isCollapsed?: boolean;
}

function PlatformSelector({ currentPlatform, onPlatformChange, isCollapsed }: PlatformSelectorProps) {
  const platforms = Object.values(PLATFORMS);
  
  const currentLabel = currentPlatform === 'all' 
    ? 'Toutes les plateformes' 
    : PLATFORMS[currentPlatform].name;

  const trigger = (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start gap-2 h-10',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Building2 className="h-4 w-4 shrink-0" />
      {!isCollapsed && (
        <>
          <span className="truncate flex-1 text-left text-sm">{currentLabel}</span>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
        </>
      )}
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="right">{currentLabel}</TooltipContent>
          </Tooltip>
        ) : (
          trigger
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Plateforme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={currentPlatform} onValueChange={(v) => onPlatformChange(v as Platform | 'all')}>
          <DropdownMenuRadioItem value="all">
            <span className="mr-2">🌐</span>
            Toutes les plateformes
          </DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          {platforms.map((platform) => (
            <DropdownMenuRadioItem key={platform.id} value={platform.id}>
              <span className="mr-2">{platform.icon}</span>
              {platform.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Status Indicator
// ============================================================================

function StatusIndicator({ isCollapsed }: { isCollapsed?: boolean }) {
  const { isLive, totalActive, hasCriticalAlerts } = useGlobalStats();

  if (!isLive && !hasCriticalAlerts) return null;

  const content = (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
        hasCriticalAlerts
          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
          : 'bg-green-500/10 text-green-600 dark:text-green-400'
      )}
    >
      <span className="relative flex h-2 w-2">
        <span
          className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            hasCriticalAlerts ? 'bg-red-400' : 'bg-green-400'
          )}
        />
        <span
          className={cn(
            'relative inline-flex rounded-full h-2 w-2',
            hasCriticalAlerts ? 'bg-red-500' : 'bg-green-500'
          )}
        />
      </span>
      {!isCollapsed && (
        <span className="font-medium">
          {hasCriticalAlerts ? 'Alertes critiques' : `${totalActive} en cours`}
        </span>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div className="flex justify-center px-3">{content}</div>
        </TooltipTrigger>
        <TooltipContent side="right">
          {hasCriticalAlerts ? 'Alertes critiques' : `${totalActive} tâches en cours`}
        </TooltipContent>
      </Tooltip>
    );
  }

  return <div className="px-3">{content}</div>;
}

// ============================================================================
// User Profile Menu
// ============================================================================

function UserProfileMenu({ isCollapsed }: { isCollapsed?: boolean }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const trigger = (
    <Button
      variant="ghost"
      className={cn(
        'w-full h-auto py-2 px-2',
        isCollapsed ? 'justify-center' : 'justify-start gap-3'
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-medium truncate max-w-[140px]">{user.name}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{user.email}</span>
        </div>
      )}
    </Button>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
            <TooltipContent side="right">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        ) : (
          trigger
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
          <User className="mr-2 h-4 w-4" />
          Profil
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Paramètres
        </DropdownMenuItem>
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {theme === 'dark' ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : theme === 'light' ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Monitor className="mr-2 h-4 w-4" />
            )}
            Thème
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}>
              <DropdownMenuRadioItem value="light">
                <Sun className="mr-2 h-4 w-4" />
                Clair
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="mr-2 h-4 w-4" />
                Sombre
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Monitor className="mr-2 h-4 w-4" />
                Système
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuItem onClick={() => window.open('/docs', '_blank')}>
          <HelpCircle className="mr-2 h-4 w-4" />
          Documentation
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={logout} className="text-red-600 dark:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Main Sidebar Component
// ============================================================================

export function Sidebar({ defaultCollapsed = false, onCollapsedChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [currentPlatform, setCurrentPlatform] = useState<Platform | 'all'>('all');

  const handleCollapsedChange = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    onCollapsedChange?.(collapsed);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-screen bg-slate-900 dark:bg-slate-950 border-r border-slate-800 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-3 border-b border-slate-800 shrink-0">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600 text-white font-bold text-sm shrink-0">
              CE
            </div>
            {!isCollapsed && (
              <span className="font-semibold text-lg truncate text-white">Content Engine</span>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => handleCollapsedChange(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Platform Selector */}
        <div className="px-2 py-2 border-b border-slate-800 shrink-0">
          <PlatformSelector
            currentPlatform={currentPlatform}
            onPlatformChange={setCurrentPlatform}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Status Indicator */}
        <div className="py-2 shrink-0">
          <StatusIndicator isCollapsed={isCollapsed} />
        </div>

        {/* Menu */}
        <SidebarMenu isCollapsed={isCollapsed} />

        {/* Footer - User Profile */}
        <div className="mt-auto border-t border-slate-800 p-2 shrink-0">
          <UserProfileMenu isCollapsed={isCollapsed} />
        </div>
      </aside>
    </TooltipProvider>
  );
}

export default Sidebar;
