/**
 * Sidebar Component - VERSION CORRIGÉE
 * FIXED: Ajout de position fixed pour que le sidebar reste à gauche
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
import SidebarMenu from './SidebarMenu';
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
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              {trigger}
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{currentLabel}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>
          {trigger}
        </DropdownMenuTrigger>
      )}

      <DropdownMenuContent side="right" align="start" className="w-64">
        <DropdownMenuLabel>Sélectionner une plateforme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => onPlatformChange('all')}
          className="gap-2"
        >
          {currentPlatform === 'all' && <Check className="h-4 w-4" />}
          <span className={currentPlatform !== 'all' ? 'ml-6' : ''}>
            Toutes les plateformes
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {platforms.map((platform) => (
          <DropdownMenuItem
            key={platform.id}
            onClick={() => onPlatformChange(platform.id)}
            className="gap-2"
          >
            {currentPlatform === platform.id && <Check className="h-4 w-4" />}
            <span className={currentPlatform !== platform.id ? 'ml-6' : ''}>
              {platform.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// Status Indicator
// ============================================================================

interface StatusIndicatorProps {
  isCollapsed?: boolean;
}

function StatusIndicator({ isCollapsed }: StatusIndicatorProps) {
  const { stats, isLoading } = useGlobalStats();

  if (isLoading || !stats) {
    return null;
  }

  const activeGenerations = stats.activeGenerations || 0;
  const queuedItems = stats.queuedItems || 0;

  if (activeGenerations === 0 && queuedItems === 0) {
    return null;
  }

  const content = (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </div>
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-300 truncate">
            {activeGenerations > 0 && `${activeGenerations} en cours`}
            {activeGenerations > 0 && queuedItems > 0 && ' • '}
            {queuedItems > 0 && `${queuedItems} en attente`}
          </p>
        </div>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="px-2">
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{activeGenerations} génération(s) en cours</p>
          <p>{queuedItems} élément(s) en attente</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return <div className="px-2">{content}</div>;
}

// ============================================================================
// User Profile Menu
// ============================================================================

interface UserProfileMenuProps {
  isCollapsed?: boolean;
}

function UserProfileMenu({ isCollapsed }: UserProfileMenuProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const userInitials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const trigger = (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start gap-3 h-12',
        isCollapsed && 'justify-center px-0'
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.avatar} alt={user?.name} />
        <AvatarFallback className="bg-primary-600 text-white text-xs">
          {userInitials}
        </AvatarFallback>
      </Avatar>
      {!isCollapsed && (
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium truncate text-white">{user?.name}</p>
          <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        </div>
      )}
    </Button>
  );

  return (
    <DropdownMenu>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              {trigger}
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{user?.name}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>
          {trigger}
        </DropdownMenuTrigger>
      )}

      <DropdownMenuContent side="right" align="end" className="w-56">
        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profil</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Paramètres</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {theme === 'light' && <Sun className="mr-2 h-4 w-4" />}
            {theme === 'dark' && <Moon className="mr-2 h-4 w-4" />}
            {theme === 'system' && <Monitor className="mr-2 h-4 w-4" />}
            <span>Thème</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
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

        <DropdownMenuItem onClick={() => window.open('https://docs.example.com', '_blank')}>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Documentation</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleLogout} className="text-red-600 dark:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
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
          // ✅ CORRECTION: Ajout de fixed left-0 top-0 z-40
          'fixed left-0 top-0 z-40 flex flex-col h-screen bg-slate-900 dark:bg-slate-950 border-r border-slate-800 transition-all duration-300',
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

        {/* Menu - FIXED: overflow-y-auto pour scroll */}
        <div className="flex-1 overflow-y-auto">
          <SidebarMenu isCollapsed={isCollapsed} />
        </div>

        {/* Footer - User Profile */}
        <div className="mt-auto border-t border-slate-800 p-2 shrink-0">
          <UserProfileMenu isCollapsed={isCollapsed} />
        </div>
      </aside>
    </TooltipProvider>
  );
}

export default Sidebar;
