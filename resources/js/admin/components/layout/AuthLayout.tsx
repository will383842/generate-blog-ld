import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export interface AuthLayoutProps {
  children?: React.ReactNode;
  className?: string;
  logo?: React.ReactNode;
  logoHref?: string;
  backgroundImage?: string;
  showBranding?: boolean;
  brandingText?: string;
}

export function AuthLayout({
  children,
  className,
  logo,
  logoHref = '/',
  backgroundImage,
  showBranding = true,
  brandingText = 'Content Engine',
}: AuthLayoutProps) {
  return (
    <div className={cn('min-h-screen flex', className)}>
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto w-full max-w-sm">
          {logo && (
            <div className="mb-8">
              <Link to={logoHref} className="inline-block">
                {logo}
              </Link>
            </div>
          )}
          {children || <Outlet />}
        </div>
      </div>

      {/* Right side - Branding */}
      <div
        className={cn(
          'hidden lg:flex lg:flex-1 relative',
          !backgroundImage && 'bg-gradient-to-br from-primary to-primary/80'
        )}
        style={
          backgroundImage
            ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        {backgroundImage && <div className="absolute inset-0 bg-black/40" />}

        {showBranding && (
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="max-w-md">
              <h2 className="text-4xl font-bold mb-4">{brandingText}</h2>
              <p className="text-lg text-white/80">
                Automated content generation platform powered by AI. Create, manage, and publish content at scale.
              </p>
              <div className="mt-8 space-y-4">
                {['AI-powered content generation', 'Multi-language support', 'SEO optimization', 'Automated publishing'].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-white/80" />
                    <span className="text-white/90">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!backgroundImage && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default AuthLayout;
