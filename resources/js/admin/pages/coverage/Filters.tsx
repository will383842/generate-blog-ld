import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';

interface CoverageFilter {
  id: string;
  name: string;
  countries: number;
  minCoverage: number;
  maxCoverage: number;
  isActive: boolean;
}

export default function FiltersPage() {
  const { data: filters = [], isLoading } = useQuery<CoverageFilter[]>({
    queryKey: ['coverage', 'filters'],
    queryFn: async () => {
      const res = await fetch('/api/coverage/filters');
      if (!res.ok) throw new Error('Failed to fetch filters');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Filter className="h-6 w-6" />
            Filtres de Couverture
          </h1>
          <p className="text-muted-foreground">Gestion des filtres de couverture par pays</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau filtre
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres configurés</CardTitle>
        </CardHeader>
        <CardContent>
          {filters.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun filtre configuré</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du filtre</TableHead>
                  <TableHead>Nombre de pays</TableHead>
                  <TableHead>Couverture min</TableHead>
                  <TableHead>Couverture max</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filters.map((filter) => (
                  <TableRow key={filter.id}>
                    <TableCell className="font-medium">{filter.name}</TableCell>
                    <TableCell>{filter.countries} pays</TableCell>
                    <TableCell>{filter.minCoverage}%</TableCell>
                    <TableCell>{filter.maxCoverage}%</TableCell>
                    <TableCell>
                      <Badge variant={filter.isActive ? 'default' : 'secondary'}>
                        {filter.isActive ? 'Actif' : 'Inactif'}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
