/**
 * INTELLIGENT COVERAGE - COUNTRIES GRID
 * Vue complète des 197 pays avec barres de progression
 * Inclut: Recrutement, Notoriété, Fondateur (Williams Jullin)
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Users, TrendingUp, Target, Scale, Briefcase, Sparkles,
  Search, RefreshCw, Download, ZoomIn, ZoomOut, ArrowUpDown,
  ChevronLeft, Filter, User
} from 'lucide-react';

// Types
interface CountryItem {
  id: number;
  name: string;
  code: string;
  region: string;
  recruitment_score: number;
  awareness_score: number;
  founder_score: number;
  overall_score: number;
  status: string;
  priority_score: number;
  total_articles: number;
  published_articles: number;
  unpublished_articles: number;
  missing_targets: number;
}

// Plateformes
const PLATFORMS = [
  { id: 1, code: 'sos-expat', name: 'SOS-Expat', icon: Scale, gradient: 'from-red-500 to-orange-500' },
  { id: 2, code: 'ulixai', name: 'Ulixai', icon: Briefcase, gradient: 'from-blue-500 to-indigo-500' },
  { id: 3, code: 'ulysse', name: 'Ulysse.AI', icon: Sparkles, gradient: 'from-purple-500 to-pink-500', disabled: true },
];

// Régions
const REGIONS = [
  { code: '', name: 'Toutes les régions' },
  { code: 'Europe', name: 'Europe' },
  { code: 'Asia', name: 'Asie' },
  { code: 'Africa', name: 'Afrique' },
  { code: 'North America', name: 'Amérique du Nord' },
  { code: 'South America', name: 'Amérique du Sud' },
  { code: 'Oceania', name: 'Océanie' },
  { code: 'Middle East', name: 'Moyen-Orient' },
];

// Tailles d'affichage
const DISPLAY_SIZES = [
  { code: 'xs', name: 'XS', cols: 10, cellW: 16, cellH: 20 },
  { code: 'sm', name: 'S', cols: 8, cellW: 20, cellH: 24 },
  { code: 'md', name: 'M', cols: 6, cellW: 28, cellH: 32 },
  { code: 'lg', name: 'L', cols: 4, cellW: 40, cellH: 44 },
];

// Options de tri
const SORT_OPTIONS = [
  { code: 'overall_score', name: 'Score global' },
  { code: 'recruitment_score', name: 'Recrutement' },
  { code: 'awareness_score', name: 'Notoriété' },
  { code: 'founder_score', name: 'Fondateur' },
  { code: 'name', name: 'Nom A-Z' },
  { code: 'priority_score', name: 'Priorité' },
];

// Helpers
function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌍';
  const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-emerald-600';
  if (score >= 40) return 'text-yellow-600';
  if (score >= 20) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBorderColor(score: number): string {
  if (score >= 80) return 'border-green-400';
  if (score >= 60) return 'border-emerald-400';
  if (score >= 40) return 'border-yellow-400';
  if (score >= 20) return 'border-orange-400';
  return 'border-red-400';
}

function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-green-500 to-emerald-500';
  if (score >= 60) return 'from-emerald-500 to-teal-500';
  if (score >= 40) return 'from-yellow-500 to-orange-500';
  if (score >= 20) return 'from-orange-500 to-red-500';
  return 'from-red-500 to-red-600';
}

// Composant cellule pays
const CountryCell: React.FC<{
  country: CountryItem;
  size: typeof DISPLAY_SIZES[0];
  onClick: () => void;
  index: number;
}> = ({ country, size, onClick, index }) => {
  const isSmall = size.code === 'xs' || size.code === 'sm';
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.01, 0.5) }}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-lg border-2 ${getScoreBorderColor(country.overall_score)}
        bg-white hover:shadow-lg transition-shadow overflow-hidden group
      `}
      style={{ width: `${size.cellW * 4}px`, height: `${size.cellH * 4}px` }}
      title={`${country.name} - ${country.overall_score.toFixed(1)}%`}
    >
      {/* Barre indicateur en haut */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getScoreGradient(country.overall_score)}`} />
      
      {/* Contenu */}
      <div className="flex flex-col items-center justify-center h-full p-1">
        {/* Drapeau */}
        <span className={`${isSmall ? 'text-xl' : 'text-3xl'}`}>
          {getCountryFlag(country.code)}
        </span>
        
        {/* Nom (caché sur petites tailles) */}
        {!isSmall && (
          <span className="text-[10px] font-medium text-slate-700 truncate max-w-full px-1 mt-1">
            {country.name}
          </span>
        )}
        
        {/* Progress bars */}
        <div className="w-full px-1 mt-1 space-y-0.5">
          {/* Recrutement */}
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${country.recruitment_score}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            />
          </div>
          {/* Notoriété */}
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${country.awareness_score}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            />
          </div>
          {/* Fondateur */}
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${country.founder_score}%` }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
            />
          </div>
        </div>
        
        {/* Score (caché sur petites tailles) */}
        {!isSmall && (
          <span className={`text-xs font-bold mt-1 ${getScoreColor(country.overall_score)}`}>
            {country.overall_score.toFixed(0)}%
          </span>
        )}
      </div>

      {/* Tooltip on hover */}
      <div className="absolute inset-0 bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white text-center">
        <span className="text-lg">{getCountryFlag(country.code)}</span>
        <span className="text-xs font-semibold">{country.name}</span>
        <span className="text-[10px] text-slate-300">{country.region}</span>
        <div className="grid grid-cols-3 gap-1 mt-2 text-[9px] w-full">
          <div className="text-center">
            <div className="font-bold text-blue-400">{country.recruitment_score.toFixed(0)}%</div>
            <div className="text-slate-400">Recr.</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-purple-400">{country.awareness_score.toFixed(0)}%</div>
            <div className="text-slate-400">Not.</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-amber-400">{country.founder_score.toFixed(0)}%</div>
            <div className="text-slate-400">Fond.</div>
          </div>
        </div>
        <span className={`text-sm font-bold mt-1 ${getScoreColor(country.overall_score)}`}>
          {country.overall_score.toFixed(1)}% Global
        </span>
      </div>
    </motion.div>
  );
};

// Composant badge stats
const StatBadge: React.FC<{
  count: number;
  label: string;
  color: string;
}> = ({ count, label, color }) => (
  <div className={`px-3 py-1.5 rounded-lg ${color} flex items-center gap-2`}>
    <span className="font-bold text-sm">{count}</span>
    <span className="text-xs opacity-80">{label}</span>
  </div>
);

// Composant principal
export default function IntelligentCountriesGrid() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // États
  const [platformId, setPlatformId] = useState(Number(searchParams.get('platform_id')) || 1);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [sortBy, setSortBy] = useState('overall_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [displaySize, setDisplaySize] = useState(DISPLAY_SIZES[1]); // 'sm' par défaut
  const [showMissingOnly, setShowMissingOnly] = useState(false);

  // Fetch data
  const { data, isLoading, refetch, isFetching, isError, error } = useQuery({
    queryKey: ['coverage', 'countries', platformId],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: CountryItem[] }>(
        '/admin/coverage/intelligent/countries',
        { params: { platform_id: platformId, per_page: 250 } }
      );
      if (!response.data.success) {
        throw new Error('Erreur lors du chargement des pays');
      }
      return response.data.data;
    },
    staleTime: 60000,
    retry: 2,
  });

  // Filtrage et tri
  const filteredCountries = useMemo(() => {
    if (!data) return [];
    
    let filtered = [...data];
    
    // Recherche
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(s) || 
        c.code.toLowerCase().includes(s)
      );
    }
    
    // Région
    if (region) {
      filtered = filtered.filter(c => c.region === region);
    }
    
    // Manquants uniquement
    if (showMissingOnly) {
      filtered = filtered.filter(c => c.overall_score < 20);
    }
    
    // Tri
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof CountryItem];
      const bVal = b[sortBy as keyof CountryItem];

      if (sortBy === 'name' && typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
    
    return filtered;
  }, [data, search, region, sortBy, sortOrder, showMissingOnly]);

  // Stats calculées
  const stats = useMemo(() => {
    if (!filteredCountries.length) return null;
    
    return {
      total: filteredCountries.length,
      excellent: filteredCountries.filter(c => c.overall_score >= 80).length,
      good: filteredCountries.filter(c => c.overall_score >= 60 && c.overall_score < 80).length,
      partial: filteredCountries.filter(c => c.overall_score >= 40 && c.overall_score < 60).length,
      minimal: filteredCountries.filter(c => c.overall_score >= 20 && c.overall_score < 40).length,
      missing: filteredCountries.filter(c => c.overall_score < 20).length,
      avgScore: filteredCountries.reduce((sum, c) => sum + c.overall_score, 0) / filteredCountries.length,
    };
  }, [filteredCountries]);

  // Changer de plateforme
  const handlePlatformChange = (id: number) => {
    setPlatformId(id);
    setSearchParams({ platform_id: String(id) });
  };

  // Changer de taille
  const handleZoom = (direction: 'in' | 'out') => {
    const currentIndex = DISPLAY_SIZES.findIndex(s => s.code === displaySize.code);
    if (direction === 'in' && currentIndex < DISPLAY_SIZES.length - 1) {
      setDisplaySize(DISPLAY_SIZES[currentIndex + 1]);
    } else if (direction === 'out' && currentIndex > 0) {
      setDisplaySize(DISPLAY_SIZES[currentIndex - 1]);
    }
  };

  const currentPlatform = PLATFORMS.find(p => p.id === platformId) || PLATFORMS[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header sticky */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          {/* Ligne 1: Titre et plateformes */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/coverage/intelligent')}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Globe className="w-6 h-6 text-indigo-600" />
                  Couverture Globale - 197 Pays
                </h1>
                <p className="text-xs text-slate-500">
                  Vue complète avec barres de progression par plateforme
                </p>
              </div>
            </div>

            {/* Plateformes */}
            <div className="flex items-center gap-2">
              {PLATFORMS.map(platform => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => !platform.disabled && handlePlatformChange(platform.id)}
                    disabled={platform.disabled}
                    className={`
                      px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2
                      ${platformId === platform.id
                        ? `bg-gradient-to-r ${platform.gradient} text-white shadow-lg`
                        : platform.disabled
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{platform.name}</span>
                    {platform.disabled && <span className="text-[10px]">(Bientôt)</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ligne 2: Filtres */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Recherche */}
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un pays..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Région */}
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {REGIONS.map(r => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.code} value={o.code}>{o.name}</option>
              ))}
            </select>

            {/* Ordre */}
            <button
              onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
              title={sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
            >
              <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'asc' ? 'rotate-180' : ''} transition-transform`} />
            </button>

            {/* Zoom */}
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => handleZoom('out')}
                disabled={displaySize.code === 'xs'}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-50"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-medium text-slate-600 min-w-[24px] text-center">
                {displaySize.name}
              </span>
              <button
                onClick={() => handleZoom('in')}
                disabled={displaySize.code === 'lg'}
                className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-50"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Rafraîchir */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${isFetching ? 'animate-spin' : ''}`} />
            </button>

            {/* Export */}
            <button className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
              <Download className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {stats && (
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-200 py-2 px-4">
            <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatBadge count={stats.total} label="Total" color="bg-slate-200 text-slate-700" />
                <StatBadge count={stats.excellent} label="Excellent" color="bg-green-100 text-green-700" />
                <StatBadge count={stats.good} label="Bon" color="bg-emerald-100 text-emerald-700" />
                <StatBadge count={stats.partial} label="Partiel" color="bg-yellow-100 text-yellow-700" />
                <StatBadge count={stats.minimal} label="Minimal" color="bg-orange-100 text-orange-700" />
                <StatBadge count={stats.missing} label="Manquant" color="bg-red-100 text-red-700" />
              </div>
              
              <div className="flex items-center gap-4">
                <div className={`text-lg font-bold ${getScoreColor(stats.avgScore)}`}>
                  Moyenne: {stats.avgScore.toFixed(1)}%
                </div>
                
                <button
                  onClick={() => setShowMissingOnly(!showMissingOnly)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    showMissingOnly
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {showMissingOnly ? '✓ Manquants uniquement' : 'Tous les pays'}
                </button>

                {/* Mini progress bar */}
                <div className="hidden md:flex items-center gap-1 w-40">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="bg-green-500" style={{ width: `${(stats.excellent / stats.total) * 100}%` }} />
                    <div className="bg-emerald-500" style={{ width: `${(stats.good / stats.total) * 100}%` }} />
                    <div className="bg-yellow-500" style={{ width: `${(stats.partial / stats.total) * 100}%` }} />
                    <div className="bg-orange-500" style={{ width: `${(stats.minimal / stats.total) * 100}%` }} />
                    <div className="bg-red-500" style={{ width: `${(stats.missing / stats.total) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-[1800px] mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            <p className="text-slate-500 text-sm">Chargement de 197 pays...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Globe className="w-16 h-16 text-red-300" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800">Erreur de chargement</h3>
              <p className="text-slate-500 text-sm mt-1">
                {(error as Error)?.message || 'Impossible de charger les pays'}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        ) : (
          <>
            <div 
              className="flex flex-wrap gap-2 justify-center"
              style={{ 
                display: 'grid',
                gridTemplateColumns: `repeat(${displaySize.cols}, minmax(0, 1fr))`,
                gap: '8px',
                justifyItems: 'center'
              }}
            >
              <AnimatePresence mode="popLayout">
                {filteredCountries.map((country, index) => (
                  <CountryCell
                    key={country.id}
                    country={country}
                    size={displaySize}
                    index={index}
                    onClick={() => navigate(`/coverage/intelligent/countries/${country.id}?platform_id=${platformId}`)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {filteredCountries.length === 0 && (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Aucun pays trouvé avec ces filtres</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Legend fixe en bas */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-lg rounded-xl shadow-lg border border-slate-200 px-4 py-3 z-40">
        <div className="flex items-center gap-6 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-500 font-medium">Scores:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>≥80%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>60-79%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>40-59%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>20-39%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>&lt;20%</span>
            </div>
          </div>
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex items-center gap-4">
            <span className="text-slate-500 font-medium">Barres:</span>
            <div className="flex items-center gap-1">
              <div className="w-6 h-2 rounded bg-gradient-to-r from-blue-500 to-indigo-500" />
              <span>Recrutement</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-2 rounded bg-gradient-to-r from-purple-500 to-pink-500" />
              <span>Notoriété</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-2 rounded bg-gradient-to-r from-amber-500 to-yellow-500" />
              <span>Fondateur</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
