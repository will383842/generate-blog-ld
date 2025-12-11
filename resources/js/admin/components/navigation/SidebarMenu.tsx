/**
 * Sidebar Menu Component - FIXED
 * Navigation menu adapté au sidebar collapsible
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
  Target,
  Users,
  Activity,
  Shield,
  Sliders,
  FileText,
  Zap,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    title: 'Live',
    icon: <Zap className="w-5 h-5" />,
    children: [
      { title: 'Generation', icon: <Activity className="w-4 h-4" />, path: '/live/generation' },
      { title: 'Publishing', icon: <Send className="w-4 h-4" />, path: '/live/publishing' },
    ],
  },
  {
    title: 'SEO',
    icon: <TrendingUp className="w-5 h-5" />,
    children: [
      { title: 'Performance', icon: <Activity className="w-4 h-4" />, path: '/seo/performance' },
      { title: 'Schema', icon: <FileText className="w-4 h-4" />, path: '/seo/schema' },
      { title: 'Indexing', icon: <Globe className="w-4 h-4" />, path: '/seo/indexing' },
    ],
  },
  {
    title: 'Analytics',
    icon: <TrendingUp className="w-5 h-5" />,
    children: [
      { title: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, path: '/analytics' },
      { title: 'Benchmarks', icon: <Target className="w-4 h-4" />, path: '/analytics/benchmarks' },
    ],
  },
];

interface SidebarMenuProps {
  isCollapsed?: boolean;
}

export default function SidebarMenu({ isCollapsed }: SidebarMenuProps) {
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
    <nav className="py-2 px-2 space-y-1">
      {menuItems.map((item) => (
        <div key={item.title}>
          <button
            onClick={() => toggleSection(item.title)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors',
              openSections.includes(item.title) && 'bg-slate-800 text-white',
              isCollapsed && 'justify-center'
            )}
          >
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="font-medium text-sm">{item.title}</span>
                </div>
                {openSections.includes(item.title) ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </>
            ) : (
              <>{item.icon}</>
            )}
          </button>

          {!isCollapsed && openSections.includes(item.title) && item.children && (
            <div className="ml-7 mt-1 space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.path}
                  to={child.path!}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors',
                    isActive(child.path) && 'bg-slate-800 text-white font-medium'
                  )}
                >
                  {child.icon}
                  <span>{child.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
