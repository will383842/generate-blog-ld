/**
 * INTELLIGENT COVERAGE - COUNTRIES LIST
 * Liste des 197 pays avec filtres et tri avancés
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Globe, Users, TrendingUp, Scale, Briefcase, Sparkles,
  Search, RefreshCw, ChevronLeft, ChevronRight, ArrowUpDown,
  Filter, Eye, User
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

// Statuts
const STATUSES = [
  { code: '', name: 'Tous les statuts' },
  { code: 'excellent', name: 'Excellent (≥80%)' },
  { code: 'good', name: 'Bon (60-79%)' },
  { code: 'partial', name: 'Partiel (40-59%)' },
  { code: 'minimal', name: 'Minimal (20-39%)' },
  { code: 'missing', name: 'Manquant (<20%)' },
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

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-emerald-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'excellent': return 'bg-green-100 text-green-700 border-green-200';
    case 'good': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'partial': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'minimal': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'missing': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'excellent': return 'Excellent';
    case 'good': return 'Bon';
    case 'partial': return 'Partiel';
    case 'minimal': return 'Minimal';
    case 'missing': return 'Manquant';
    default: return status;
  }
}

// Progress bar component
const ProgressBar: React.FC<{
  value: number;
  color: string;
  label: string;
}> = ({ value, color, label }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-slate-500 w-14">{label}</span>
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.5 }}
        className={`h-full ${color}`}
      />
    </div>
    <span className="text-xs font-medium w-10 text-right">{value.toFixed(0)}%</span>
  </div>
);

// Country row component
const CountryRow: React.FC<{
  country: CountryItem;
  onClick: () => void;
  index: number;
}> = ({ country, onClick, index }) => (
  <motion.tr
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.02 }}
    onClick={onClick}
    className="cursor-pointer hover:bg-slate-50 transition-colors group"
  >
    <td className="px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getCountryFlag(country.code)}</span>
        <div>
          <div className="font-medium text-slate-800">{country.name}</div>
          <div className="text-xs text-slate-500">{country.region}</div>
        </div>
      </div>
    </td>
    <td className="px-4 py-3">
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(country.status)}`}>
        {getStatusLabel(country.status)}
      </span>
    </td>
    <td className="px-4 py-3">
      <div className={`text-xl font-bold ${getScoreColor(country.overall_score)}`}>
        {country.overall_score.toFixed(1)}%
      </div>
    </td>
    <td className="px-4 py-3 hidden lg:table-cell">
      <div className="w-32">
        <ProgressBar 
          value={country.recruitment_score} 
          color="bg-gradient-to-r from-blue-500 to-indigo-500" 
          label="Recr."
        />
      </div>
    </td>
    <td className="px-4 py-3 hidden lg:table-cell">
      <div className="w-32">
        <ProgressBar 
          value={country.awareness_score} 
          color="bg-gradient-to-r from-purple-500 to-pink-500" 
          label="Not."
        />
      </div>
    </td>
    <td className="px-4 py-3 hidden xl:table-cell">
      <div className="w-32">
        <ProgressBar 
          value={country.founder_score} 
          color="bg-gradient-to-r from-amber-500 to-yellow-500" 
          label="Fond."
        />
      </div>
    </td>
    <td className="px-4 py-3 hidden md:table-cell">
      <div className="text-sm">
        <span className="text-green-600 font-medium">{country.published_articles}</span>
        <span className="text-slate-400"> / </span>
        <span className="text-slate-600">{country.total_articles}</span>
      </div>
    </td>
    <td className="px-4 py-3">
      <button className="p-2 rounded-lg opacity-0 group-hover:opacity-100 bg-indigo-100 text-indigo-600 transition-opacity">
        <Eye className="w-4 h-4" />
      </button>
    </td>
  </motion.tr>
);

// Main component
export default function IntelligentCountriesList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // States
  const [platformId, setPlatformId] = useState(Number(searchParams.get('platform_id')) || 1);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('priority_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch data
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['coverage', 'countries', platformId],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: CountryItem[] }>(
        '/admin/coverage/intelligent/countries',
        { params: { platform_id: platformId, per_page: 250 } }
      );
      return response.data.data;
    },
    staleTime: 60000,
  });

  // Filter and sort
  const filteredCountries = useMemo(() => {
    if (!data) return [];
    
    let filtered = [...data];
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(s) || 
        c.code.toLowerCase().includes(s)
      );
    }
    
    if (region) {
      filtered = filtered.filter(c => c.region === region);
    }
    
    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }
    
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof CountryItem];
      const bVal = b[sortBy as keyof CountryItem];

      if (sortBy === 'name' && typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return sortOrder === 'asc' ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
    
    return filtered;
  }, [data, search, region, status, sortBy, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    if (!data) return null;
    return {
      total: data.length,
      excellent: data.filter(c => c.status === 'excellent').length,
      good: data.filter(c => c.status === 'good').length,
      partial: data.filter(c => c.status === 'partial').length,
      minimal: data.filter(c => c.status === 'minimal').length,
      missing: data.filter(c => c.status === 'missing').length,
    };
  }, [data]);

  const handlePlatformChange = (id: number) => {
    setPlatformId(id);
    setSearchParams({ platform_id: String(id) });
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
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
                  Liste des 197 Pays
                </h1>
                <p className="text-xs text-slate-500">
                  Filtres avancés et tri par colonne
                </p>
              </div>
            </div>

            {/* Platforms */}
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
                  </button>
                );
              })}
              
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors ml-2"
              >
                <RefreshCw className={`w-5 h-5 text-slate-600 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
            >
              {REGIONS.map(r => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
            >
              {STATUSES.map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>

            {stats && (
              <div className="ml-auto text-sm text-slate-500">
                {filteredCountries.length} / {stats.total} pays
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Pays
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Statut</th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100"
                    onClick={() => toggleSort('overall_score')}
                  >
                    <div className="flex items-center gap-1">
                      Score
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden lg:table-cell">
                    Recrutement
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden lg:table-cell">
                    Notoriété
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden xl:table-cell">
                    Fondateur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden md:table-cell">
                    Articles
                  </th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCountries.map((country, index) => (
                  <CountryRow
                    key={country.id}
                    country={country}
                    index={index}
                    onClick={() => navigate(`/coverage/intelligent/countries/${country.id}?platform_id=${platformId}`)}
                  />
                ))}
              </tbody>
            </table>

            {filteredCountries.length === 0 && (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Aucun pays trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
