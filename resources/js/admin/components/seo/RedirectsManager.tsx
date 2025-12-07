/**
 * Redirects Manager Component
 * File 318 - Manage URL redirects with import/export
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight,
  Plus,
  Trash2,
  Upload,
  Download,
  Play,
  Check,
  X,
  AlertTriangle,
  Search,
  MoreHorizontal,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  useRedirects,
  useRedirectStats,
  useCreateRedirect,
  useUpdateRedirect,
  useDeleteRedirect,
  useImportRedirects,
  useTestRedirect,
} from '@/hooks/useSeo';
import { REDIRECT_TYPES, RedirectType, Redirect } from '@/types/seo';
import { cn } from '@/lib/utils';

interface RedirectsManagerProps {
  compact?: boolean;
}

export function RedirectsManager({ compact = false }: RedirectsManagerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [newRedirect, setNewRedirect] = useState({ from: '', to: '', type: '301' as RedirectType });
  const [testUrl, setTestUrl] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // API hooks
  const { data: redirectsData, isLoading } = useRedirects();
  const { data: stats } = useRedirectStats();
  const createRedirect = useCreateRedirect();
  const updateRedirect = useUpdateRedirect();
  const deleteRedirect = useDeleteRedirect();
  const importRedirects = useImportRedirects();
  const testRedirect = useTestRedirect();

  // Filtered redirects
  const filteredRedirects = redirectsData?.data?.filter(r =>
    r.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle create
  const handleCreate = () => {
    createRedirect.mutate(newRedirect, {
      onSuccess: () => {
        setShowAddDialog(false);
        setNewRedirect({ from: '', to: '', type: '301' });
      },
    });
  };

  // Handle import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importRedirects.mutate(file);
    }
  };

  // Handle export
  const handleExport = () => {
    const csv = [
      'from,to,type,hits',
      ...(redirectsData?.data?.map(r => `${r.from},${r.to},${r.type},${r.hits}`) || []),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'redirects.csv';
    a.click();
  };

  // Handle test
  const handleTest = () => {
    testRedirect.mutate(testUrl, {
      onSuccess: (result) => {
        setTestResult(result);
      },
    });
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteRedirect.mutate(id));
    setSelectedIds(new Set());
  };

  // Toggle selection
  const toggleSelection = (id: number) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  // Toggle all
  const toggleAll = () => {
    if (selectedIds.size === filteredRedirects?.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRedirects?.map(r => r.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Redirections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats?.active || 0}</p>
              <p className="text-xs text-muted-foreground">Actives</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalHits || 0}</p>
              <p className="text-xs text-muted-foreground">Hits</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Actives</p>
            <p className="text-2xl font-bold text-green-600">{stats?.active || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total hits</p>
            <p className="text-2xl font-bold">{stats?.totalHits?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Cassées</p>
            <p className="text-2xl font-bold text-red-600">{stats?.brokenCount || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowTestDialog(true)}>
                <Play className="h-4 w-4 mr-2" />
                Tester
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
          <span className="text-sm font-medium">{selectedIds.size} sélectionnée(s)</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      )}

      {/* Redirects Table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.size === filteredRedirects?.length && filteredRedirects.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>De</TableHead>
                  <TableHead>Vers</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Hits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRedirects?.map(redirect => (
                  <TableRow key={redirect.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(redirect.id)}
                        onCheckedChange={() => toggleSelection(redirect.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1 rounded">
                        {redirect.from}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-sm bg-muted px-1 rounded truncate max-w-xs">
                          {redirect.to}
                        </code>
                        <a
                          href={redirect.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={redirect.type === '301' ? 'default' : 'secondary'}>
                        {redirect.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {redirect.hits.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {redirect.isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => updateRedirect.mutate({
                              id: redirect.id,
                              isActive: !redirect.isActive,
                            })}
                          >
                            {redirect.isActive ? 'Désactiver' : 'Activer'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setTestUrl(redirect.from);
                              setShowTestDialog(true);
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Tester
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteRedirect.mutate(redirect.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une redirection</DialogTitle>
            <DialogDescription>
              Créez une nouvelle règle de redirection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL source</Label>
              <Input
                value={newRedirect.from}
                onChange={(e) => setNewRedirect({ ...newRedirect, from: e.target.value })}
                placeholder="/ancienne-url"
                className="mt-1"
              />
            </div>
            <div>
              <Label>URL destination</Label>
              <Input
                value={newRedirect.to}
                onChange={(e) => setNewRedirect({ ...newRedirect, to: e.target.value })}
                placeholder="/nouvelle-url ou https://..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Type de redirection</Label>
              <Select
                value={newRedirect.type}
                onValueChange={(v) => setNewRedirect({ ...newRedirect, type: v as RedirectType })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REDIRECT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {type.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createRedirect.isPending || !newRedirect.from || !newRedirect.to}
            >
              {createRedirect.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tester une redirection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>URL à tester</Label>
              <Input
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="/url-a-tester"
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleTest}
              disabled={testRedirect.isPending || !testUrl}
              className="w-full"
            >
              {testRedirect.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Tester
            </Button>

            {testResult && (
              <div className={cn(
                'p-4 rounded-lg',
                testResult.status === 301 || testResult.status === 302 ? 'bg-green-50' : 'bg-red-50'
              )}>
                <p className="font-medium">
                  Status: {testResult.status}
                </p>
                <p className="text-sm mt-1">
                  Destination: {testResult.destination}
                </p>
                {testResult.chain.length > 1 && (
                  <div className="mt-2">
                    <p className="text-sm text-yellow-600 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Chaîne de redirections ({testResult.chain.length})
                    </p>
                    <ul className="text-xs mt-1 space-y-1">
                      {testResult.chain.map((url: string, idx: number) => (
                        <li key={idx}>→ {url}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RedirectsManager;
