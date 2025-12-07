/**
 * Quick Generate Component
 * Modal for quick content generation from coverage gaps
 */

import { useState, useMemo } from 'react';
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  SelectRoot as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { useGenerateMissing } from '@/hooks/useCoverage';
import { useTemplates } from '@/hooks/useTemplates';
import type { CoverageGap, CoveragePriority } from '@/types/coverage';

interface QuickGenerateProps {
  gaps: CoverageGap[];
  open: boolean;
  onClose: () => void;
}

export function QuickGenerate({ gaps, open, onClose }: QuickGenerateProps) {
  const [step, setStep] = useState<'config' | 'confirm' | 'result'>('config');
  const [templateId, setTemplateId] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [selectedGapIds, setSelectedGapIds] = useState<Set<string>>(
    new Set(gaps.map((g) => g.id))
  );

  const { data: templatesData } = useTemplates();
  const generateMissing = useGenerateMissing();

  const templates = templatesData?.data || [];
  const selectedGaps = gaps.filter((g) => selectedGapIds.has(g.id));

  // Estimates
  const estimates = useMemo(() => {
    const total = selectedGaps.length;
    const cost = selectedGaps.reduce((sum, g) => sum + g.estimatedCost, 0);
    const articles = selectedGaps.reduce((sum, g) => sum + g.estimatedArticles, 0);
    
    // Estimate duration based on articles
    let duration = '';
    if (articles <= 10) duration = '~5 minutes';
    else if (articles <= 50) duration = '~20 minutes';
    else if (articles <= 100) duration = '~45 minutes';
    else duration = '~2 heures';

    return { total, cost, articles, duration };
  }, [selectedGaps]);

  const handleToggleGap = (gapId: string, checked: boolean) => {
    const next = new Set(selectedGapIds);
    if (checked) {
      next.add(gapId);
    } else {
      next.delete(gapId);
    }
    setSelectedGapIds(next);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedGapIds(new Set(gaps.map((g) => g.id)));
    } else {
      setSelectedGapIds(new Set());
    }
  };

  const handleGenerate = async () => {
    try {
      await generateMissing.mutateAsync({
        gapIds: Array.from(selectedGapIds),
        options: {
          templateId: templateId || undefined,
          scheduledAt: scheduledAt || undefined,
        },
      });
      setStep('result');
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  const handleClose = () => {
    setStep('config');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Génération rapide
          </DialogTitle>
        </DialogHeader>

        {/* Step: Config */}
        {step === 'config' && (
          <>
            <div className="space-y-4">
              {/* Gap Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Lacunes à combler</label>
                  <Checkbox
                    checked={selectedGapIds.size === gaps.length}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                  {gaps.map((gap) => (
                    <div
                      key={gap.id}
                      className={cn(
                        'flex items-center justify-between p-3 hover:bg-gray-50',
                        selectedGapIds.has(gap.id) && 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedGapIds.has(gap.id)}
                          onCheckedChange={(checked) =>
                            handleToggleGap(gap.id, checked as boolean)
                          }
                        />
                        <div>
                          <p className="font-medium text-sm">
                            {gap.countryName} - {gap.languageId.toUpperCase()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {gap.estimatedArticles} articles estimés
                          </p>
                        </div>
                      </div>
                      <PriorityBadge priority={gap.priority} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Template */}
              <div>
                <label className="text-sm font-medium mb-2 block">Template</label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Template par défaut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Template par défaut</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Schedule */}
              <div>
                <label className="text-sm font-medium mb-2 block">Planification</label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  placeholder="Générer immédiatement"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Laissez vide pour générer immédiatement
                </p>
              </div>

              {/* Estimates */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{estimates.articles}</p>
                    <p className="text-xs text-muted-foreground">Articles</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{estimates.duration}</p>
                    <p className="text-xs text-muted-foreground">Durée estimée</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">${estimates.cost.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Coût estimé</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={selectedGapIds.size === 0}
              >
                Continuer
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Confirmer la génération</p>
                  <p className="text-sm text-yellow-700">
                    Cette action va créer {estimates.articles} articles pour {selectedGapIds.size} lacunes.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Récapitulatif</h4>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {selectedGapIds.size} lacunes sélectionnées
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {estimates.articles} articles à générer
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Coût estimé: ${estimates.cost.toFixed(2)}
                  </li>
                  {scheduledAt && (
                    <li className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Planifié pour: {new Date(scheduledAt).toLocaleString('fr-FR')}
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('config')}>
                Retour
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateMissing.isPending}
              >
                {generateMissing.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Générer
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step: Result */}
        {step === 'result' && (
          <>
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Génération lancée!</h3>
              <p className="text-muted-foreground">
                {estimates.articles} articles sont en cours de génération.
                Vous pouvez suivre la progression dans la file d'attente.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Fermer
              </Button>
              <Button onClick={() => window.location.href = '/generation/queue'}>
                Voir la file d'attente
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PriorityBadge({ priority }: { priority: CoveragePriority }) {
  const config = {
    critical: { label: 'Critique', color: 'bg-red-100 text-red-700' },
    high: { label: 'Haute', color: 'bg-orange-100 text-orange-700' },
    medium: { label: 'Moyenne', color: 'bg-yellow-100 text-yellow-700' },
    low: { label: 'Basse', color: 'bg-gray-100 text-gray-700' },
  };

  const { label, color } = config[priority];

  return <Badge className={color}>{label}</Badge>;
}

/**
 * Quick Generate Button
 * Floating action button for quick generation
 */
interface QuickGenerateButtonProps {
  gaps: CoverageGap[];
  className?: string;
}

export function QuickGenerateButton({ gaps, className }: QuickGenerateButtonProps) {
  const [open, setOpen] = useState(false);

  if (gaps.length === 0) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn('gap-2', className)}
      >
        <Sparkles className="w-4 h-4" />
        Générer ({gaps.length})
      </Button>
      <QuickGenerate gaps={gaps} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
