import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import {
  Settings,
  User,
  Bell,
  Key,
  Palette,
  Image,
  Send,
  Zap,
  Database,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SettingsNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  description?: string;
}

export interface SettingsNavProps {
  items?: SettingsNavItem[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const defaultItems: SettingsNavItem[] = [
  {
    id: 'general',
    label: 'General',
    icon: <Settings className="h-4 w-4" />,
    href: '/settings/general',
    description: 'Site name, URL, and regional settings',
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: <User className="h-4 w-4" />,
    href: '/settings/profile',
    description: 'Your personal information and preferences',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="h-4 w-4" />,
    href: '/settings/notifications',
    description: 'Email and push notification preferences',
  },
  {
    id: 'api',
    label: 'API Keys',
    icon: <Key className="h-4 w-4" />,
    href: '/settings/api',
    description: 'Manage API access and tokens',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <Palette className="h-4 w-4" />,
    href: '/settings/appearance',
    description: 'Theme and display preferences',
  },
  {
    id: 'images',
    label: 'Images',
    icon: <Image className="h-4 w-4" />,
    href: '/settings/images',
    description: 'Image generation and optimization',
  },
  {
    id: 'publishing',
    label: 'Publishing',
    icon: <Send className="h-4 w-4" />,
    href: '/settings/publishing',
    description: 'Publication and distribution settings',
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: <Zap className="h-4 w-4" />,
    href: '/settings/automation',
    description: 'Automated workflows and scheduling',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: <Database className="h-4 w-4" />,
    href: '/settings/integrations',
    description: 'Third-party service connections',
  },
  {
    id: 'security',
    label: 'Security',
    icon: <Shield className="h-4 w-4" />,
    href: '/settings/security',
    description: 'Password and security settings',
  },
];

export function SettingsNav({
  items = defaultItems,
  className,
  orientation = 'vertical',
}: SettingsNavProps) {
  const { t } = useTranslation('settings');
  const location = useLocation();

  const isActive = (href: string) => location.pathname === href;

  if (orientation === 'horizontal') {
    return (
      <nav className={cn('flex items-center space-x-1 overflow-x-auto', className)}>
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors',
              isActive(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className={cn('space-y-1', className)}>
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.href}
          className={cn(
            'flex items-start gap-3 px-3 py-2 rounded-lg transition-colors',
            isActive(item.href)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <span className="mt-0.5">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{item.label}</p>
            {item.description && (
              <p
                className={cn(
                  'text-xs truncate',
                  isActive(item.href)
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                )}
              >
                {item.description}
              </p>
            )}
          </div>
        </Link>
      ))}
    </nav>
  );
}

export default SettingsNav;
