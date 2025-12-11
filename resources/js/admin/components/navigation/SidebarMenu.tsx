/**
 * Sidebar Menu Component
 * Main navigation sidebar with collapsible sections
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Globe,
  TrendingUp,
  DollarSign,
  Target,
  Users,
  Activity,
  User,
  Shield,
  Sliders,
  Clock,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    title: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    children: [
      { title: 'Countries', icon: <Globe className="w-4 h-4" />, path: '/settings/countries' },
      { title: 'Platforms', icon: <LayoutDashboard className="w-4 h-4" />, path: '/settings/platforms' },
      { title: 'Notifications', icon: <Activity className="w-4 h-4" />, path: '/settings/notifications' },
    ],
  },
  {
    title: 'Admin',
    icon: <Shield className="w-5 h-5" />,
    children: [
      { title: 'Workers', icon: <Users className="w-4 h-4" />, path: '/admin/workers' },
    ],
  },
  {
    title: 'Coverage',
    icon: <Globe className="w-5 h-5" />,
    children: [
      { title: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, path: '/coverage' },
      { title: 'Countries', icon: <Globe className="w-4 h-4" />, path: '/coverage/countries' },
      { title: 'Languages', icon: <Target className="w-4 h-4" />, path: '/coverage/languages' },
      { title: 'Filters', icon: <Sliders className="w-4 h-4" />, path: '/coverage/filters' },
      { title: 'Intelligent', icon: <Activity className="w-4 h-4" />, path: '/coverage/intelligent' },
    ],
  },
  {
    title: 'SEO',
    icon: <TrendingUp className="w-5 h-5" />,
    children: [
      { title: 'Performance', icon: <Activity className="w-4 h-4" />, path: '/seo/performance' },
    ],
  },
  {
    title: 'Analytics',
    icon: <TrendingUp className="w-5 h-5" />,
    children: [
      { title: 'Trends', icon: <TrendingUp className="w-4 h-4" />, path: '/analytics/trends' },
      { title: 'Costs', icon: <DollarSign className="w-4 h-4" />, path: '/analytics/costs' },
    ],
  },
  {
    title: 'Live',
    icon: <Activity className="w-5 h-5" />,
    children: [
      { title: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, path: '/live' },
      { title: 'Generation', icon: <Activity className="w-4 h-4" />, path: '/live/generation' },
      { title: 'Translation', icon: <Globe className="w-4 h-4" />, path: '/live/translation' },
      { title: 'Publishing', icon: <Target className="w-4 h-4" />, path: '/live/publishing' },
      { title: 'Indexing', icon: <TrendingUp className="w-4 h-4" />, path: '/live/indexing' },
      { title: 'Alerts', icon: <Activity className="w-4 h-4" />, path: '/live/alerts' },
    ],
  },
];

export default function SidebarMenu() {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>(['Settings', 'Coverage', 'Live']);

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="h-full flex flex-col bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">Content Engine V10</h2>
        <p className="text-sm text-muted-foreground">Admin Dashboard</p>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.title}>
            <button
              onClick={() => toggleSection(item.title)}
              className={cn(
                'w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors',
                openSections.includes(item.title) && 'bg-accent'
              )}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span className="font-medium">{item.title}</span>
              </div>
              {openSections.includes(item.title) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {openSections.includes(item.title) && item.children && (
              <div className="ml-4 mt-1 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.path}
                    to={child.path!}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg transition-colors',
                      isActive(child.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    )}
                  >
                    {child.icon}
                    <span className="text-sm">{child.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* User Profile Menu */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <Avatar className="w-8 h-8">
                <AvatarImage src="" />
                <AvatarFallback>WJ</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Williams Jullin</div>
                <div className="text-xs text-muted-foreground">Super Admin</div>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Mon Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/profile/security" className="cursor-pointer">
                <Shield className="w-4 h-4 mr-2" />
                Sécurité
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/profile/preferences" className="cursor-pointer">
                <Sliders className="w-4 h-4 mr-2" />
                Préférences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/profile/sessions" className="cursor-pointer">
                <Clock className="w-4 h-4 mr-2" />
                Sessions
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
