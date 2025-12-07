import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import {
  Plus,
  Copy,
  Check,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  permissions: string[];
}

export interface ApiKeyManagerProps {
  keys: ApiKey[];
  onCreateKey: (name: string, permissions: string[]) => Promise<{ key: string }>;
  onRevokeKey: (id: string) => Promise<void>;
  onRegenerateKey: (id: string) => Promise<{ key: string }>;
  availablePermissions?: string[];
  loading?: boolean;
  className?: string;
}

const defaultPermissions = [
  'read:content',
  'write:content',
  'read:analytics',
  'write:settings',
  'admin',
];

export function ApiKeyManager({
  keys,
  onCreateKey,
  onRevokeKey,
  onRegenerateKey,
  availablePermissions = defaultPermissions,
  loading = false,
  className,
}: ApiKeyManagerProps) {
  const { t } = useTranslation('settings');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setIsCreating(true);
    try {
      const result = await onCreateKey(newKeyName, selectedPermissions);
      setNewKey(result.key);
    } catch (error) {
      console.error('Failed to create key:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyKey = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  const resetCreateDialog = () => {
    setNewKeyName('');
    setSelectedPermissions([]);
    setNewKey(null);
    setCreateDialogOpen(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('api.title')}
            </CardTitle>
            <CardDescription>{t('api.description')}</CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('api.createKey')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              {newKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>API Key Created</DialogTitle>
                    <DialogDescription>
                      Copy your API key now. You won't be able to see it again.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                      <span className="flex-1 break-all">{newKey}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyKey(newKey, 'new')}
                      >
                        {copiedKeyId === 'new' ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={resetCreateDialog}>Done</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>{t('api.createKey')}</DialogTitle>
                    <DialogDescription>
                      Create a new API key to access the API programmatically.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyName">{t('api.name')}</Label>
                      <Input
                        id="keyName"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production API Key"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('api.permissions')}</Label>
                      <div className="flex flex-wrap gap-2">
                        {availablePermissions.map((perm) => (
                          <Badge
                            key={perm}
                            variant={
                              selectedPermissions.includes(perm)
                                ? 'default'
                                : 'outline'
                            }
                            className="cursor-pointer"
                            onClick={() => {
                              setSelectedPermissions((prev) =>
                                prev.includes(perm)
                                  ? prev.filter((p) => p !== perm)
                                  : [...prev, perm]
                              );
                            }}
                          >
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetCreateDialog}>
                      {t('actions.cancel')}
                    </Button>
                    <Button
                      onClick={handleCreateKey}
                      disabled={!newKeyName.trim() || isCreating}
                    >
                      {t('api.createKey')}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No API keys yet. Create one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('api.name')}</TableHead>
                <TableHead>{t('api.key')}</TableHead>
                <TableHead>{t('api.permissions')}</TableHead>
                <TableHead>{t('api.lastUsed')}</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span>
                        {visibleKeys.has(apiKey.id)
                          ? apiKey.key
                          : maskKey(apiKey.key)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleCopyKey(apiKey.key, apiKey.id)}
                      >
                        {copiedKeyId === apiKey.id ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {apiKey.permissions.slice(0, 2).map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                      {apiKey.permissions.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{apiKey.permissions.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(apiKey.lastUsed)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onRegenerateKey(apiKey.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          {t('api.regenerate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onRevokeKey(apiKey.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('api.revoke')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default ApiKeyManager;
