import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};
    
    if (!email) {
      errors.email = t('validation.required', { field: 'Email' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('validation.email');
    }
    
    if (!password) {
      errors.password = t('validation.required', { field: 'Password' });
    } else if (password.length < 6) {
      errors.password = t('validation.minLength', { field: 'Password', min: 6 });
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await login({ email, password });
      // Navigation is handled by useAuth hook after successful login
    } catch (err) {
      // Error is handled by useAuth hook
      console.error('[Login] Error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            {t('auth.login.title', 'Content Engine Admin')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('auth.login.subtitle', 'Sign in to your account')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Input
            label={t('auth.email', 'Email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={validationErrors.email}
            placeholder="admin@example.com"
            autoComplete="email"
            disabled={isLoading}
          />

          <Input
            label={t('auth.password', 'Password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={validationErrors.password}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={isLoading}
          >
            {t('auth.login.submit', 'Sign In')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <a href="/forgot-password" className="hover:text-primary">
            {t('auth.forgotPassword', 'Forgot your password?')}
          </a>
        </div>
      </Card>
    </div>
  );
}
