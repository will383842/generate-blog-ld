import React, { useState } from 'react';
import { Globe, Search, Plus, Edit2, Trash2, RefreshCw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useCountries, CONTINENTS, CONTINENT_LABELS } from '@/hooks/useCountries';

export default function CountriesPage() {
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'articlesCount' | 'coveragePercent'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { countries, isLoading, refetch } = useCountries({
    search,
    continent: continent !== 'all' ? (continent as any) : undefined,
    sortBy,
    sortOrder,
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = sortOrder === 'asc' ? ChevronUp : ChevronDown;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Gestion des Pays
          </h1>
          <p className="text-muted-foreground">Configuration et couverture des 197 pays</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des Pays</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={continent} onValueChange={setContinent}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Continent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {CONTINENTS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CONTINENT_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16"></TableHead>
                <TableHead>
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1">
                    Pays {sortBy === 'name' && <SortIcon className="h-4 w-4" />}
                  </button>
                </TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Continent</TableHead>
                <TableHead>
                  <button onClick={() => handleSort('articlesCount')} className="flex items-center gap-1">
                    Articles {sortBy === 'articlesCount' && <SortIcon className="h-4 w-4" />}
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => handleSort('coveragePercent')} className="flex items-center gap-1">
                    Couverture {sortBy === 'coveragePercent' && <SortIcon className="h-4 w-4" />}
                  </button>
                </TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {countries.map((country) => (
                <TableRow key={country.code}>
                  <TableCell className="text-2xl">{country.flag}</TableCell>
                  <TableCell className="font-medium">{country.name}</TableCell>
                  <TableCell className="font-mono text-sm">{country.code}</TableCell>
                  <TableCell>{CONTINENT_LABELS[country.continent]}</TableCell>
                  <TableCell>{country.articlesCount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2" style={{ width: `${country.coveragePercent}%` }} />
                      </div>
                      <span className="text-sm">{country.coveragePercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={country.isActive ? 'default' : 'secondary'}>
                      {country.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
