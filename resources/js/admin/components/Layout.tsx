import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  MapPin, 
  BarChart3, 
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Content Hub', href: '/admin/content-hub', icon: FileText },
    { name: 'Coverage', href: '/admin/coverage', icon: MapPin },
    { name: 'Generation', href: '/admin/generation', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    window.location.href = '/logout';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Admin</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Admin Console</h1>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg
                    transition-colors duration-150
                    ${active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon 
                    size={20} 
                    className={active ? 'text-blue-700' : 'text-gray-400'} 
                  />
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut size={20} />
              <span className="ml-3">Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};