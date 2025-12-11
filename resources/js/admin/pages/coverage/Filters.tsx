import React, { useState } from 'react';
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
  const [filters] = useState<CoverageFilter[]>([
    { id: '1', name: 'Pays prioritaires', countries: 25, minCoverage: 0, maxCoverage: 50, isActive: true },
    { id: '2', name: 'Couverture complète', countries: 48, minCoverage: 80, maxCoverage: 100, isActive: true },
    { id: '3', name: 'Couverture moyenne', countries: 74, minCoverage: 50, maxCoverage: 80, isActive: true },
    { id: '4', name: 'Couverture faible', countries: 50, minCoverage: 0, maxCoverage: 50, isActive: false },
  ]);

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
        </CardContent>
      </Card>
    </div>
  );
}