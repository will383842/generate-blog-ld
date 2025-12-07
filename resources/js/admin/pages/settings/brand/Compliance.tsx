/**
 * Brand Compliance Tester Page
 * File 260 - Full page for testing content compliance
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowLeft,
  Loader2,
  History,
  FileText,
  Clock,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { usePlatform } from '@/hooks/usePlatform';
import { ComplianceTester } from '@/components/settings/ComplianceTester';
import { ComplianceResult } from '@/types/brand';
import { cn } from '@/lib/utils';

interface TestHistoryItem {
  id: string;
  content: string;
  contentType: string;
  result: ComplianceResult;
  timestamp: Date;
}

export default function BrandCompliancePage() {
  const { t } = useTranslation();
  const { currentPlatform } = usePlatform();
  const platformId = currentPlatform?.id || 0;

  // State
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<TestHistoryItem | null>(null);

  // Handle result change
  const handleResultChange = (result: ComplianceResult | null) => {
    if (result) {
      const newItem: TestHistoryItem = {
        id: Date.now().toString(),
        content: '', // Would need to capture from ComplianceTester
        contentType: 'article',
        result,
        timestamp: new Date(),
      };
      setTestHistory(prev => [newItem, ...prev].slice(0, 20)); // Keep last 20
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Clear history
  const clearHistory = () => {
    setTestHistory([]);
    setSelectedHistoryItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings/brand">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              Test de compliance
            </h1>
            <p className="text-muted-foreground">
              Vérifiez la conformité de votre contenu avec les guidelines de marque
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="tester">
        <TabsList>
          <TabsTrigger value="tester">
            <FileText className="h-4 w-4 mr-2" />
            Testeur
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Historique
            {testHistory.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {testHistory.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tester" className="mt-6">
          <ComplianceTester
            platformId={platformId}
            onResultChange={handleResultChange}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {testHistory.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* History List */}
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Tests récents</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {testHistory.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedHistoryItem(item)}
                          className={cn(
                            'w-full p-3 rounded-lg border text-left transition-colors',
                            selectedHistoryItem?.id === item.id
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs">
                              {item.contentType}
                            </Badge>
                            <span className={cn('font-bold', getScoreColor(item.result.score))}>
                              {item.result.score}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {item.timestamp.toLocaleTimeString()}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.result.violations.length} violation(s)
                          </p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Selected Item Detail */}
              <Card className="lg:col-span-2">
                {selectedHistoryItem ? (
                  <>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Détail du test
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {selectedHistoryItem.contentType}
                          </Badge>
                          <Badge
                            variant={
                              selectedHistoryItem.result.score >= 80
                                ? 'default'
                                : selectedHistoryItem.result.score >= 60
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            Score: {selectedHistoryItem.result.score}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>
                        Testé le {selectedHistoryItem.timestamp.toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Criteria Breakdown */}
                      <div className="mb-6">
                        <h4 className="font-medium mb-3">Scores par critère</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(selectedHistoryItem.result.criteria).map(([key, value]) => (
                            <div
                              key={key}
                              className="p-3 rounded-lg bg-muted text-center"
                            >
                              <div className={cn('text-xl font-bold', getScoreColor(value))}>
                                {value}%
                              </div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {key.replace(/_/g, ' ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Violations */}
                      {selectedHistoryItem.result.violations.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">
                            Violations ({selectedHistoryItem.result.violations.length})
                          </h4>
                          <div className="space-y-2">
                            {selectedHistoryItem.result.violations.map((violation, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg border text-sm"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge
                                    variant={
                                      violation.severity === 'critical'
                                        ? 'destructive'
                                        : 'outline'
                                    }
                                  >
                                    {violation.severity}
                                  </Badge>
                                  <span className="font-medium">{violation.message}</span>
                                </div>
                                {violation.suggestion && (
                                  <p className="text-green-600 text-xs">
                                    💡 {violation.suggestion}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggestions */}
                      {selectedHistoryItem.result.suggestions.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-medium mb-3">Suggestions</h4>
                          <ul className="space-y-1">
                            {selectedHistoryItem.result.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Sélectionnez un test pour voir les détails
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">Aucun historique</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Les tests de compliance effectués apparaîtront ici
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
