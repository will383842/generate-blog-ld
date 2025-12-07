import React from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
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
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PublicationSettingsData {
  autoPublish: boolean;
  defaultStatus: 'draft' | 'pending' | 'published';
  requireApproval: boolean;
  scheduleEnabled: boolean;
  defaultScheduleTime: string;
  notifyOnPublish: boolean;
  socialShare: boolean;
  platforms: string[];
}

export interface PublicationSettingsProps {
  initialData?: Partial<PublicationSettingsData>;
  onSave: (data: PublicationSettingsData) => Promise<void>;
  loading?: boolean;
  className?: string;
}

const availablePlatforms = [
  { id: 'wordpress', name: 'WordPress' },
  { id: 'medium', name: 'Medium' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'twitter', name: 'Twitter/X' },
  { id: 'facebook', name: 'Facebook' },
];

export function PublicationSettings({
  initialData,
  onSave,
  loading = false,
  className,
}: PublicationSettingsProps) {
  const { t } = useTranslation('settings');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<PublicationSettingsData>({
    defaultValues: {
      autoPublish: initialData?.autoPublish ?? false,
      defaultStatus: initialData?.defaultStatus || 'draft',
      requireApproval: initialData?.requireApproval ?? true,
      scheduleEnabled: initialData?.scheduleEnabled ?? true,
      defaultScheduleTime: initialData?.defaultScheduleTime || '09:00',
      notifyOnPublish: initialData?.notifyOnPublish ?? true,
      socialShare: initialData?.socialShare ?? false,
      platforms: initialData?.platforms || [],
    },
  });

  const platforms = watch('platforms');

  const togglePlatform = (platformId: string) => {
    const current = watch('platforms');
    const updated = current.includes(platformId)
      ? current.filter((p) => p !== platformId)
      : [...current, platformId];
    setValue('platforms', updated, { shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(onSave)} className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Publication Settings
          </CardTitle>
          <CardDescription>
            Configure how content is published across platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-publish */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-publish content</Label>
              <p className="text-sm text-muted-foreground">
                Automatically publish content after generation
              </p>
            </div>
            <Switch
              checked={watch('autoPublish')}
              onCheckedChange={(checked) => setValue('autoPublish', checked, { shouldDirty: true })}
            />
          </div>

          {/* Default status */}
          <div className="space-y-2">
            <Label>Default Content Status</Label>
            <Select
              value={watch('defaultStatus')}
              onValueChange={(value) => setValue('defaultStatus', value as 'draft' | 'pending' | 'published', { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Require approval */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Require approval</Label>
              <p className="text-sm text-muted-foreground">
                Content must be approved before publishing
              </p>
            </div>
            <Switch
              checked={watch('requireApproval')}
              onCheckedChange={(checked) => setValue('requireApproval', checked, { shouldDirty: true })}
            />
          </div>

          {/* Schedule settings */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable scheduling</Label>
                <p className="text-sm text-muted-foreground">
                  Allow content to be scheduled for later
                </p>
              </div>
              <Switch
                checked={watch('scheduleEnabled')}
                onCheckedChange={(checked) => setValue('scheduleEnabled', checked, { shouldDirty: true })}
              />
            </div>

            {watch('scheduleEnabled') && (
              <div className="space-y-2">
                <Label>Default publish time</Label>
                <Input
                  type="time"
                  {...register('defaultScheduleTime')}
                  className="w-32"
                />
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label>Notify on publish</Label>
              <p className="text-sm text-muted-foreground">
                Send notifications when content is published
              </p>
            </div>
            <Switch
              checked={watch('notifyOnPublish')}
              onCheckedChange={(checked) => setValue('notifyOnPublish', checked, { shouldDirty: true })}
            />
          </div>

          {/* Social sharing */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label>Social media sharing</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically share to social platforms
                </p>
              </div>
              <Switch
                checked={watch('socialShare')}
                onCheckedChange={(checked) => setValue('socialShare', checked, { shouldDirty: true })}
              />
            </div>

            {watch('socialShare') && (
              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="flex flex-wrap gap-2">
                  {availablePlatforms.map((platform) => (
                    <Button
                      key={platform.id}
                      type="button"
                      variant={platforms.includes(platform.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => togglePlatform(platform.id)}
                    >
                      {platform.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('actions.save')}
        </Button>
      </div>
    </form>
  );
}

export default PublicationSettings;
