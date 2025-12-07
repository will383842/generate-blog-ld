import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  User,
  Bell,
  Key,
  Image,
  Send,
  Workflow,
  Plug,
  Shield,
  Database,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SettingsNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface SettingsLayoutProps {
  children?: React.ReactNode;
  className?: string;
  sidebarWidth?: number;
  title?: string;
  description?: string;
}

const navItems: SettingsNavItem[] = [
  { id: 'general', label: 'General', href: '/settings/general', icon: <Settings className="h-4 w-4" /> },
  { id: 'profile', label: 'Profile', href: '/settings/profile', icon: <User className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', href: '/settings/notifications', icon: <Bell className="h-4 w-4" /> },
  { id: 'api', label: 'API Keys', href: '/settings/api', icon: <Key className="h-4 w-4" /> },
  { id: 'images', label: 'Images', href: '/settings/images', icon: <Image className="h-4 w-4" /> },
  { id: 'publication', label: 'Publication', href: '/settings/publication', icon: <Send className="h-4 w-4" /> },
  { id: 'automation', label: 'Automation', href: '/settings/automation', icon: <Workflow className="h-4 w-4" /> },
  { id: 'integrations', label: 'Integrations', href: '/settings/integrations', icon: <Plug className="h-4 w-4" /> },
  { id: 'brand', label: 'Brand', href: '/settings/brand', icon: <Palette className="h-4 w-4" /> },
  { id: 'knowledge', label: 'Knowledge', href: '/settings/knowledge', icon: <Database className="h-4 w-4" /> },
  { id: 'security', label: 'Security', href: '/settings/security', icon: <Shield className="h-4 w-4" /> },
];

export function SettingsLayout({
  children,
  className,
  sidebarWidth = 240,
  title,
  description,
}: SettingsLayoutProps) {
  const { t } = useTranslation('settings');
  const location = useLocation();

  return (
    <div className={cn('container max-w-6xl py-8', className)}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{title || t('title', 'Settings')}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>

      <div className="flex gap-8">
        <aside className="flex-shrink-0 hidden md:block" style={{ width: sidebarWidth }}>
          <nav className="sticky top-8 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.id}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {item.icon}
                  <span>{t(`nav.${item.id}`, item.label)}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children || <Outlet />}</main>
      </div>
    </div>
  );
}

export default SettingsLayout;
