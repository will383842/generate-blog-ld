import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Globe, Search, Filter, RefreshCw, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, Scale, Briefcase,
  ArrowLeft, Languages, Target, TrendingUp
} from 'lucide-react';

// Types
interface FounderData {
  founder_name: string;
  total_countries: number;
  total_targets: number;
  completed_targets: number;
  average_score: number;
  countries: FounderCountryScore[];
}

interface FounderCountryScore {
  country_id: number;
  country_name: string;
  country_code: string;
  region: string;
  score: number;
  completed_targets: number;
  total_targets: number;
  breakdown: {
    [lang: string]: {
      sos_expat: { completed: boolean; status: string };
      ulixai: { completed: boolean; status: string };
      combined_progress: number;
    };
  };
}

// Constants
const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

const REGIONS = [
  'Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania', 'Middle East'
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

// Components
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, icon, color }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4`}>
    <div className="flex items-center gap-3">
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-sm text-slate-500">{label}</div>
      </div>
    </div>
  </div>
);

const CountryFounderCard: React.FC<{
  country: FounderCountryScore;
  onClick: () => void;
}> = ({ country, onClick }) => {
  const completedLangs = Object.values(country.breakdown).filter(
    b => b.sos_expat.completed && b.ulixai.completed
  ).length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getCountryFlag(country.country_code)}</span>
          <div>
            <div className="font-semibold text-slate-800">{country.country_name}</div>
            <div className="text-xs text-slate-500">{country.region}</div>
          </div>
        </div>
        <div className={`text-2xl font-bold ${getScoreColor(country.score)}`}>
          {country.score.toFixed(0)}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${country.score}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${getScoreBgColor(country.score)}`}
        />
      </div>

      {/* Platforms status */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
          <Scale className="w-4 h-4 text-red-600" />
          <span className="text-xs font-medium text-red-700">SOS-Expat</span>
          <span className="ml-auto text-xs text-red-600">
            {Object.values(country.breakdown).filter(b => b.sos_expat.completed).length}/9
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
          <Briefcase className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-medium text-blue-700">Ulixai</span>
          <span className="ml-auto text-xs text-blue-600">
            {Object.values(country.breakdown).filter(b => b.ulixai.completed).length}/9
          </span>
        </div>
      </div>

      {/* Languages grid */}
      <div className="flex flex-wrap gap-1">
        {LANGUAGES.map(lang => {
          const langData = country.breakdown[lang.code];
          const bothCompleted = langData?.sos_expat.completed && langData?.ulixai.completed;
          const oneCompleted = langData?.sos_expat.completed || langData?.ulixai.completed;
          
          return (
            <div
              key={lang.code}
              className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium
                ${bothCompleted 
                  ? 'bg-green-100 text-green-700' 
                  : oneCompleted 
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              title={`${lang.name}: ${bothCompleted ? 'Complet' : oneCompleted ? 'Partiel' : 'Manquant'}`}
            >
              {lang.code.toUpperCase()}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// Main Component
export default function IntelligentFounder() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [showMissingOnly, setShowMissingOnly] = useState(false);

  // Fetch founder data
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['coverage', 'founder', 'global'],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: FounderData }>(
        '/admin/coverage/intelligent/founder'
      );
      return response.data.data;
    },
    staleTime: 60000,
  });

  // Filter countries
  const filteredCountries = useMemo(() => {
    if (!data?.countries) return [];
    
    let filtered = [...data.countries];
    
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.country_name.toLowerCase().includes(s) || 
        c.country_code.toLowerCase().includes(s)
      );
    }
    
    if (region) {
      filtered = filtered.filter(c => c.region === region);
    }
    
    if (showMissingOnly) {
      filtered = filtered.filter(c => c.score < 100);
    }
    
    return filtered;
  }, [data, search, region, showMissingOnly]);

  // Stats
  const stats = useMemo(() => {
    if (!data) return null;
    
    const complete = data.countries.filter(c => c.score >= 100).length;
    const partial = data.countries.filter(c => c.score > 0 && c.score < 100).length;
    const missing = data.countries.filter(c => c.score === 0).length;
    
    return { complete, partial, missing };
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/coverage/intelligent')}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-7 h-7 text-amber-600" />
                  Thème Fondateur
                </h1>
                <p className="text-sm text-slate-500">
                  Williams Jullin — Cross-platform SOS-Expat & Ulixai
                </p>
              </div>
            </div>
            
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Score moyen"
                value={`${data.average_score.toFixed(1)}%`}
                icon={<Target className="w-5 h-5 text-amber-600" />}
                color="bg-amber-100"
              />
              <StatCard
                label="Pays complets"
                value={stats?.complete || 0}
                icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
                color="bg-green-100"
              />
              <StatCard
                label="Pays partiels"
                value={stats?.partial || 0}
                icon={<AlertCircle className="w-5 h-5 text-yellow-600" />}
                color="bg-yellow-100"
              />
              <StatCard
                label="Pays manquants"
                value={stats?.missing || 0}
                icon={<XCircle className="w-5 h-5 text-red-600" />}
                color="bg-red-100"
              />
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-start gap-3">
                <User className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800">Articles sur Williams Jullin</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Ce thème est indépendant de la plateforme sélectionnée. Il regroupe les articles 
                    sur le fondateur pour <strong>SOS-Expat</strong> et <strong>Ulixai</strong> combinés.
                  </p>
                  <p className="text-sm text-amber-600 mt-2">
                    Objectif: 1 article par plateforme × 9 langues × 197 pays = <strong>{data.total_targets} articles</strong>
                  </p>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="text-amber-700">
                      Complétés: <strong className="text-green-600">{data.completed_targets}</strong>
                    </span>
                    <span className="text-amber-700">
                      Manquants: <strong className="text-red-600">{data.total_targets - data.completed_targets}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un pays..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Toutes les régions</option>
                  {REGIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>

                <button
                  onClick={() => setShowMissingOnly(!showMissingOnly)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    showMissingOnly
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {showMissingOnly ? 'Incomplets uniquement' : 'Tous les pays'}
                </button>

                <div className="text-sm text-slate-500">
                  {filteredCountries.length} pays affichés
                </div>
              </div>
            </div>

            {/* Countries Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredCountries.map((country, index) => (
                  <motion.div
                    key={country.country_id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <CountryFounderCard
                      country={country}
                      onClick={() => navigate(`/coverage/intelligent/countries/${country.country_id}?tab=founder`)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredCountries.length === 0 && (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Aucun pays trouvé</p>
              </div>
            )}

            {/* Legend */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Légende</h4>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center text-xs text-green-700">FR</div>
                  <span className="text-slate-600">Complet (SOS-Expat + Ulixai)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-yellow-100 flex items-center justify-center text-xs text-yellow-700">EN</div>
                  <span className="text-slate-600">Partiel (une seule plateforme)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-xs text-slate-400">DE</div>
                  <span className="text-slate-600">Manquant</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">Aucune donnée disponible</p>
          </div>
        )}
      </div>
    </div>
  );
}
