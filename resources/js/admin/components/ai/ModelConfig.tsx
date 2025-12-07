/**
 * Model Config Component
 * File 300 - Configure AI models per content type with fallback chains
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  DollarSign,
  FlaskConical,
  Save,
  RotateCcw,
  Loader2,
  GripVertical,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/Collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Tooltip';
import { useModelConfigs, useModelInfo, useUpdateModelConfig, ModelConfig, ModelInfo } from '@/hooks/useMonitoring';
import { cn } from '@/lib/utils';

interface ModelConfigProps {
  compact?: boolean;
}

export function ModelConfigComponent({ compact = false }: ModelConfigProps) {
  const { t } = useTranslation();
  const [expandedConfigs, setExpandedConfigs] = useState<Set<number>>(new Set());
  const [editedConfigs, setEditedConfigs] = useState<Map<number, Partial<ModelConfig>>>(new Map());

  // API hooks
  const { data: configs, isLoading: configsLoading } = useModelConfigs();
  const { data: models } = useModelInfo();
  const updateConfig = useUpdateModelConfig();

  // Toggle expansion
  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedConfigs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedConfigs(newExpanded);
  };

  // Get edited config or original
  const getConfig = (config: ModelConfig) => {
    const edited = editedConfigs.get(config.id);
    return edited ? { ...config, ...edited } : config;
  };

  // Update local edit
  const updateLocalEdit = (id: number, changes: Partial<ModelConfig>) => {
    const current = editedConfigs.get(id) || {};
    setEditedConfigs(new Map(editedConfigs).set(id, { ...current, ...changes }));
  };

  // Reset edits
  const resetEdits = (id: number) => {
    const newEdits = new Map(editedConfigs);
    newEdits.delete(id);
    setEditedConfigs(newEdits);
  };

  // Save config
  const saveConfig = (id: number) => {
    const edits = editedConfigs.get(id);
    if (!edits) return;
    updateConfig.mutate({ id, ...edits }, {
      onSuccess: () => resetEdits(id),
    });
  };

  // Get model by ID
  const getModel = (modelId: string): ModelInfo | undefined => {
    return models?.find(m => m.id === modelId);
  };

  // Calculate estimated cost
  const calculateCost = (modelId: string, tokens: number = 1000) => {
    const model = getModel(modelId);
    if (!model) return 0;
    return ((model.input_cost_per_1k + model.output_cost_per_1k) / 2) * (tokens / 1000);
  };

  if (configsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {configs?.slice(0, 5).map(config => {
          const model = getModel(config.primary_model);
          return (
            <div
              key={config.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div>
                <span className="font-medium">{config.content_type}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{model?.name || config.primary_model}</Badge>
                  {config.ab_testing_enabled && (
                    <Badge className="bg-purple-100 text-purple-800">A/B</Badge>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                ${calculateCost(config.primary_model).toFixed(4)}/1k
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {configs?.map(config => {
        const editedConfig = getConfig(config);
        const hasChanges = editedConfigs.has(config.id);
        const primaryModel = getModel(editedConfig.primary_model);
        const isExpanded = expandedConfigs.has(config.id);

        return (
          <Collapsible
            key={config.id}
            open={isExpanded}
            onOpenChange={() => toggleExpand(config.id)}
          >
            <Card className={cn(hasChanges && 'border-yellow-400')}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base">{editedConfig.content_type}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{primaryModel?.name || editedConfig.primary_model}</Badge>
                          <span>•</span>
                          <span>${calculateCost(editedConfig.primary_model).toFixed(4)}/1k tokens</span>
                          {editedConfig.ab_testing_enabled && (
                            <>
                              <span>•</span>
                              <Badge className="bg-purple-100 text-purple-800">
                                <FlaskConical className="h-3 w-3 mr-1" />
                                A/B Test
                              </Badge>
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasChanges && (
                        <Badge variant="outline" className="bg-yellow-50">Non sauvegardé</Badge>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="space-y-6 pt-0">
                  {/* Primary Model */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Modèle principal</Label>
                      <Select
                        value={editedConfig.primary_model}
                        onValueChange={(v) => updateLocalEdit(config.id, { primary_model: v })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {models?.map(model => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{model.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ${(model.input_cost_per_1k + model.output_cost_per_1k).toFixed(4)}/1k
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Max tokens</Label>
                      <Input
                        type="number"
                        value={editedConfig.max_tokens}
                        onChange={(e) => updateLocalEdit(config.id, { max_tokens: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Temperature */}
                  <div>
                    <Label>Température: {editedConfig.temperature}</Label>
                    <Slider
                      value={editedConfig.temperature}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLocalEdit(config.id, { temperature: parseFloat(e.target.value) })}
                      min={0}
                      max={2}
                      step={0.1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Plus bas = plus déterministe, plus haut = plus créatif
                    </p>
                  </div>

                  {/* Fallback Models */}
                  <div>
                    <Label className="flex items-center gap-2">
                      Modèles de repli
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Utilisés si le modèle principal échoue
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <div className="mt-2 space-y-2">
                      {editedConfig.fallback_models.map((modelId, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <Select
                            value={modelId}
                            onValueChange={(v) => {
                              const newFallbacks = [...editedConfig.fallback_models];
                              newFallbacks[idx] = v;
                              updateLocalEdit(config.id, { fallback_models: newFallbacks });
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {models?.map(model => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFallbacks = editedConfig.fallback_models.filter((_, i) => i !== idx);
                              updateLocalEdit(config.id, { fallback_models: newFallbacks });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newFallbacks = [...editedConfig.fallback_models, models?.[0]?.id || ''];
                          updateLocalEdit(config.id, { fallback_models: newFallbacks });
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter un repli
                      </Button>
                    </div>
                  </div>

                  {/* Timeout & Retry */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Timeout (ms)</Label>
                      <Input
                        type="number"
                        value={editedConfig.timeout_ms}
                        onChange={(e) => updateLocalEdit(config.id, { timeout_ms: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Tentatives</Label>
                      <Input
                        type="number"
                        value={editedConfig.retry_count}
                        onChange={(e) => updateLocalEdit(config.id, { retry_count: parseInt(e.target.value) })}
                        className="mt-1"
                        min={1}
                        max={5}
                      />
                    </div>
                  </div>

                  {/* A/B Testing */}
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-5 w-5 text-purple-600" />
                        <Label>A/B Testing</Label>
                      </div>
                      <Switch
                        checked={editedConfig.ab_testing_enabled}
                        onCheckedChange={(checked) => updateLocalEdit(config.id, { ab_testing_enabled: checked })}
                      />
                    </div>

                    {editedConfig.ab_testing_enabled && (
                      <div className="space-y-4">
                        <div>
                          <Label>Modèle variant</Label>
                          <Select
                            value={editedConfig.ab_variant_model || ''}
                            onValueChange={(v) => updateLocalEdit(config.id, { ab_variant_model: v })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Sélectionner un modèle" />
                            </SelectTrigger>
                            <SelectContent>
                              {models?.map(model => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Trafic variant: {editedConfig.ab_traffic_percent || 50}%</Label>
                          <Slider
                            value={editedConfig.ab_traffic_percent || 50}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLocalEdit(config.id, { ab_traffic_percent: parseInt(e.target.value) })}
                            min={1}
                            max={99}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cost Comparison */}
                  {primaryModel && (
                    <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Estimation des coûts</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Input</p>
                          <p className="font-medium">${primaryModel.input_cost_per_1k}/1k</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Output</p>
                          <p className="font-medium">${primaryModel.output_cost_per_1k}/1k</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Est. par article</p>
                          <p className="font-medium">${calculateCost(editedConfig.primary_model, editedConfig.max_tokens).toFixed(4)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {hasChanges && (
                    <div className="flex items-center justify-end gap-2 pt-4 border-t">
                      <Button variant="outline" onClick={() => resetEdits(config.id)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Annuler
                      </Button>
                      <Button
                        onClick={() => saveConfig(config.id)}
                        disabled={updateConfig.isPending}
                      >
                        {updateConfig.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Sauvegarder
                      </Button>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}

export default ModelConfigComponent;
