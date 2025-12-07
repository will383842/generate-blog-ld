import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GeneralSettingsData {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  logo?: string;
  favicon?: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  defaultLanguage: string;
}

export interface GeneralSettingsProps {
  initialData?: Partial<GeneralSettingsData>;
  onSave: (data: GeneralSettingsData) => Promise<void>;
  loading?: boolean;
  className?: string;
  timezones?: { value: string; label: string }[];
  languages?: { value: string; label: string }[];
}

const defaultTimezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (ICT)' },
];

const defaultLanguages = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'pt', label: 'Português' },
];

const dateFormats = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY (31 Dec 2024)' },
];

const timeFormats = [
  { value: 'HH:mm', label: '24h (14:30)' },
  { value: 'hh:mm A', label: '12h (02:30 PM)' },
];

export function GeneralSettings({
  initialData,
  onSave,
  loading = false,
  className,
  timezones = defaultTimezones,
  languages = defaultLanguages,
}: GeneralSettingsProps) {
  const { t } = useTranslation('settings');
  const [logoPreview, setLogoPreview] = React.useState<string | null>(
    initialData?.logo || null
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<GeneralSettingsData>({
    defaultValues: {
      siteName: initialData?.siteName || '',
      siteDescription: initialData?.siteDescription || '',
      siteUrl: initialData?.siteUrl || '',
      timezone: initialData?.timezone || 'UTC',
      dateFormat: initialData?.dateFormat || 'DD/MM/YYYY',
      timeFormat: initialData?.timeFormat || 'HH:mm',
      defaultLanguage: initialData?.defaultLanguage || 'fr',
    },
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setValue('logo', reader.result as string, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setValue('logo', undefined, { shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(onSave)} className={cn('space-y-6', className)}>
      {/* Site Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t('general.title')}</CardTitle>
          <CardDescription>{t('general.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName">{t('general.siteName')}</Label>
            <Input
              id="siteName"
              {...register('siteName', { required: true })}
              placeholder="My Website"
            />
            {errors.siteName && (
              <p className="text-sm text-destructive">{t('validation.required')}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteDescription">{t('general.siteDescription')}</Label>
            <Textarea
              id="siteDescription"
              {...register('siteDescription')}
              placeholder="A brief description of your website"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siteUrl">{t('general.siteUrl')}</Label>
            <Input
              id="siteUrl"
              type="url"
              {...register('siteUrl', { required: true })}
              placeholder="https://example.com"
            />
          </div>

          {/* Logo upload */}
          <div className="space-y-2">
            <Label>{t('general.logo')}</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-16 w-16 object-contain rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={removeLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center h-16 w-16 border-2 border-dashed rounded cursor-pointer hover:border-primary">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('general.timezone')}</Label>
            <Select
              value={watch('timezone')}
              onValueChange={(value) => setValue('timezone', value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('general.defaultLanguage')}</Label>
            <Select
              value={watch('defaultLanguage')}
              onValueChange={(value) => setValue('defaultLanguage', value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('general.dateFormat')}</Label>
            <Select
              value={watch('dateFormat')}
              onValueChange={(value) => setValue('dateFormat', value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateFormats.map((fmt) => (
                  <SelectItem key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('general.timeFormat')}</Label>
            <Select
              value={watch('timeFormat')}
              onValueChange={(value) => setValue('timeFormat', value, { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeFormats.map((fmt) => (
                  <SelectItem key={fmt.value} value={fmt.value}>
                    {fmt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('actions.save')}
        </Button>
      </div>
    </form>
  );
}

export default GeneralSettings;
