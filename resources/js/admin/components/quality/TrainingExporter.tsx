import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Progress } from '@/components/ui/Progress';
import {
  Download,
  FileJson,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  description: string;
}

export interface ExportOptions {
  format: string;
  includeMetadata: boolean;
  includeScores: boolean;
  minScore?: number;
  maxSamples?: number;
  splitRatio?: { train: number; validation: number; test: number };
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  downloadUrl?: string;
  error?: string;
  stats?: {
    totalSamples: number;
    trainSamples: number;
    validationSamples: number;
    testSamples: number;
  };
}

export interface TrainingExporterProps {
  onExport: (options: ExportOptions) => Promise<ExportResult>;
  totalSamples: number;
  formats?: ExportFormat[];
  className?: string;
}

const defaultFormats: ExportFormat[] = [
  {
    id: 'jsonl',
    name: 'JSONL',
    extension: '.jsonl',
    description: 'JSON Lines format, compatible with OpenAI fine-tuning',
  },
  {
    id: 'csv',
    name: 'CSV',
    extension: '.csv',
    description: 'Comma-separated values, good for spreadsheets',
  },
  {
    id: 'parquet',
    name: 'Parquet',
    extension: '.parquet',
    description: 'Columnar format, efficient for large datasets',
  },
  {
    id: 'huggingface',
    name: 'HuggingFace Dataset',
    extension: '.arrow',
    description: 'Native HuggingFace datasets format',
  },
];

export function TrainingExporter({
  onExport,
  totalSamples,
  formats = defaultFormats,
  className,
}: TrainingExporterProps) {
  const { t } = useTranslation('quality');
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ExportResult | null>(null);

  const [options, setOptions] = useState<ExportOptions>({
    format: 'jsonl',
    includeMetadata: true,
    includeScores: true,
    minScore: 0.7,
    splitRatio: { train: 0.8, validation: 0.1, test: 0.1 },
  });

  const handleExport = async () => {
    setExporting(true);
    setProgress(0);
    setResult(null);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 10, 90));
    }, 200);

    try {
      const exportResult = await onExport(options);
      setProgress(100);
      setResult(exportResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      });
    } finally {
      clearInterval(interval);
      setExporting(false);
    }
  };

  const handleDownload = () => {
    if (result?.downloadUrl) {
      window.open(result.downloadUrl, '_blank');
    }
  };

  const resetDialog = () => {
    setResult(null);
    setProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Download className="h-4 w-4 mr-2" />
          {t('export.title')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {result ? (
          // Result view
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                {result.success ? 'Export Complete' : 'Export Failed'}
              </DialogTitle>
            </DialogHeader>
            {result.success ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Your training data has been exported successfully.
                </p>
                {result.stats && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total samples</p>
                      <p className="text-lg font-semibold">{result.stats.totalSamples}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Training</p>
                      <p className="text-lg font-semibold">{result.stats.trainSamples}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Validation</p>
                      <p className="text-lg font-semibold">{result.stats.validationSamples}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Test</p>
                      <p className="text-lg font-semibold">{result.stats.testSamples}</p>
                    </div>
                  </div>
                )}
                <Button onClick={handleDownload} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download {result.filename}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-destructive">{result.error}</p>
                <Button variant="outline" onClick={resetDialog}>
                  Try Again
                </Button>
              </div>
            )}
          </>
        ) : exporting ? (
          // Progress view
          <>
            <DialogHeader>
              <DialogTitle>Exporting Training Data</DialogTitle>
              <DialogDescription>
                Please wait while we prepare your dataset...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                {progress}% complete
              </p>
            </div>
          </>
        ) : (
          // Options view
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Export Training Data
              </DialogTitle>
              <DialogDescription>
                Export {totalSamples.toLocaleString()} samples for fine-tuning
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Format selection */}
              <div className="space-y-3">
                <Label>Export Format</Label>
                <RadioGroup
                  value={options.format}
                  onValueChange={(value) =>
                    setOptions((o) => ({ ...o, format: value }))
                  }
                  className="grid grid-cols-2 gap-2"
                >
                  {formats.map((format) => (
                    <div key={format.id}>
                      <RadioGroupItem
                        value={format.id}
                        id={format.id}
                        className="peer sr-only"
                      />
                      <Label
                        htmlFor={format.id}
                        className={cn(
                          'flex flex-col p-3 border rounded-lg cursor-pointer',
                          'peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5'
                        )}
                      >
                        <span className="font-medium">{format.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {format.description}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <Label>Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="metadata"
                      checked={options.includeMetadata}
                      onCheckedChange={(checked) =>
                        setOptions((o) => ({
                          ...o,
                          includeMetadata: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="metadata" className="font-normal">
                      Include metadata (timestamps, sources)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="scores"
                      checked={options.includeScores}
                      onCheckedChange={(checked) =>
                        setOptions((o) => ({
                          ...o,
                          includeScores: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="scores" className="font-normal">
                      Include quality scores
                    </Label>
                  </div>
                </div>
              </div>

              {/* Minimum score */}
              <div className="space-y-2">
                <Label>Minimum Quality Score</Label>
                <Select
                  value={options.minScore?.toString()}
                  onValueChange={(value) =>
                    setOptions((o) => ({ ...o, minScore: parseFloat(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All samples</SelectItem>
                    <SelectItem value="0.5">0.5+ (Low quality)</SelectItem>
                    <SelectItem value="0.7">0.7+ (Medium quality)</SelectItem>
                    <SelectItem value="0.8">0.8+ (High quality)</SelectItem>
                    <SelectItem value="0.9">0.9+ (Excellent only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TrainingExporter;
