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
import { Slider } from '@/components/ui/Slider';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageSettingsData {
  defaultSource: 'unsplash' | 'dalle' | 'library';
  autoGenerate: boolean;
  defaultQuality: number;
  maxWidth: number;
  maxHeight: number;
  format: 'webp' | 'jpg' | 'png';
  unsplashAccessKey?: string;
  dalleApiKey?: string;
  dalleModel: string;
  dalleStyle: 'natural' | 'vivid';
}

export interface ImageSettingsProps {
  initialData?: Partial<ImageSettingsData>;
  onSave: (data: ImageSettingsData) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export function ImageSettings({
  initialData,
  onSave,
  loading = false,
  className,
}: ImageSettingsProps) {
  const { t } = useTranslation('settings');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isDirty },
  } = useForm<ImageSettingsData>({
    defaultValues: {
      defaultSource: initialData?.defaultSource || 'unsplash',
      autoGenerate: initialData?.autoGenerate ?? true,
      defaultQuality: initialData?.defaultQuality || 80,
      maxWidth: initialData?.maxWidth || 1920,
      maxHeight: initialData?.maxHeight || 1080,
      format: initialData?.format || 'webp',
      dalleModel: initialData?.dalleModel || 'dall-e-3',
      dalleStyle: initialData?.dalleStyle || 'natural',
    },
  });

  const quality = watch('defaultQuality');

  return (
    <form onSubmit={handleSubmit(onSave)} className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Generation Settings
          </CardTitle>
          <CardDescription>
            Configure automatic image generation for your content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto-generate toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-generate images</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate images for new content
              </p>
            </div>
            <Switch
              checked={watch('autoGenerate')}
              onCheckedChange={(checked) => setValue('autoGenerate', checked, { shouldDirty: true })}
            />
          </div>

          {/* Default source */}
          <div className="space-y-2">
            <Label>Default Image Source</Label>
            <Select
              value={watch('defaultSource')}
              onValueChange={(value) => setValue('defaultSource', value as 'unsplash' | 'dalle' | 'library', { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unsplash">Unsplash (Free)</SelectItem>
                <SelectItem value="dalle">DALL-E (AI Generated)</SelectItem>
                <SelectItem value="library">Media Library</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quality slider */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Default Quality</Label>
              <span className="text-sm text-muted-foreground">{quality}%</span>
            </div>
            <Slider
              value={[quality]}
              onValueChange={([value]) => setValue('defaultQuality', value, { shouldDirty: true })}
              min={10}
              max={100}
              step={5}
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Width (px)</Label>
              <Input
                type="number"
                {...register('maxWidth', { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Height (px)</Label>
              <Input
                type="number"
                {...register('maxHeight', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label>Output Format</Label>
            <Select
              value={watch('format')}
              onValueChange={(value) => setValue('format', value as 'webp' | 'jpg' | 'png', { shouldDirty: true })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="webp">WebP (Recommended)</SelectItem>
                <SelectItem value="jpg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* API Keys */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">API Configuration</h4>
            <div className="space-y-2">
              <Label>Unsplash Access Key</Label>
              <Input
                type="password"
                {...register('unsplashAccessKey')}
                placeholder="Enter your Unsplash access key"
              />
            </div>
            <div className="space-y-2">
              <Label>DALL-E API Key</Label>
              <Input
                type="password"
                {...register('dalleApiKey')}
                placeholder="Enter your OpenAI API key"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>DALL-E Model</Label>
                <Select
                  value={watch('dalleModel')}
                  onValueChange={(value) => setValue('dalleModel', value, { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
                    <SelectItem value="dall-e-2">DALL-E 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>DALL-E Style</Label>
                <Select
                  value={watch('dalleStyle')}
                  onValueChange={(value) => setValue('dalleStyle', value as 'natural' | 'vivid', { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="vivid">Vivid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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

export default ImageSettings;
