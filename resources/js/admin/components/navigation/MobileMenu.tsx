import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu } from 'lucide-react';
import { SidebarMenu } from './SidebarMenu';
import { Button } from '@/components/ui/Button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/Sheet';

interface MobileMenuProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const { t } = useTranslation();
  const location = useLocation();

  // Close menu on navigation
  useEffect(() => {
    onOpenChange?.(false);
  }, [location.pathname, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={t('navigation.sidebar.expand')}
        >
          <Menu size={24} />
        </Button>
      </SheetTrigger>
      
      <SheetContent
        side="left"
        className="w-[280px] p-0 bg-slate-900 border-slate-700"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{t('navigation.sections.dashboard')}</SheetTitle>
        </SheetHeader>
        
        <div className="h-full overflow-hidden">
          <SidebarMenu collapsed={false} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function useMobileMenu() {
  const [open, setOpen] = useState(false);
  
  return {
    open,
    setOpen,
    toggle: () => setOpen(prev => !prev),
    close: () => setOpen(false)
  };
}