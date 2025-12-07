/**
 * INTELLIGENT COVERAGE - LANGUAGES VIEW
 * Vue par langue - 9 langues × 197 pays
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Languages, Globe, ChevronLeft, RefreshCw, Scale, Briefcase, Sparkles
} from 'lucide-react';

// Types
interface LanguageStats {
  language_id: number;
  language_code: string;
  language_name: string;
  total_articles: number;
  published_articles: number;
  unpublished_articles: number;
  countries_covered: number;
  coverage_percent: number;
}

// Platforms
const PLATFORMS = [
  { id: 1, code: 'sos-expat', name: 'SOS-Expat', icon: Scale, gradient: 'from-red-500 to-orange-500' },
  { id: 2, code: 'ulixai', name: 'Ulixai', icon: Briefcase, gradient: 'from-blue-500 to-indigo-500' },
  { id: 3, code: 'ulysse', name: 'Ulysse.AI', icon: Sparkles, gradient: 'from-purple-500 to-pink-500', disabled: true },
];

// Languages with flags
const LANGUAGE_INFO: Record<string, { name: string; flag: string }> = {
  fr: { name: 'Français', flag: '🇫🇷' },
  en: { name: 'English', flag: '🇬🇧' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  es: { name: 'Español', flag: '🇪🇸' },
  pt: { name: 'Português', flag: '🇵🇹' },
  ru: { name: 'Русский', flag: '🇷🇺' },
  zh: { name: '中文', flag: '🇨🇳' },
  ar: { name: 'العربية', flag: '🇸🇦' },
  hi: { name: 'हिन्दी', flag: '🇮🇳' },
};

// Helpers
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

// Language Card Component
const LanguageCard: React.FC<{
  stats: LanguageStats;
  index: number;
}> = ({ stats, index }) => {
  const info = LANGUAGE_INFO[stats.language_code] || { name: stats.language_name, flag: '🌍' };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4 mb-4">
        <span className="text-4xl">{info.flag}</span>
        <div>
          <h3 className="text-lg font-bold text-slate-800">{info.name}</h3>
          <p className="text-sm text-slate-500">{stats.language_code.toUpperCase()}</p>
        </div>
      </div>

      {/* Coverage Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-slate-600">Couverture</span>
          <span className={`font-bold ${getScoreColor(stats.coverage_percent)}`}>
            {stats.coverage_percent.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.coverage_percent}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full ${getScoreBgColor(stats.coverage_percent)}`}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-xl font-bold text-slate-800">{stats.countries_covered}</div>
          <div className="text-xs text-slate-500">Pays couverts</div>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <div className="text-xl font-bold text-slate-800">{stats.total_articles}</div>
          <div className="text-xs text-slate-500">Articles totaux</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-xl font-bold text-green-600">{stats.published_articles}</div>
          <div className="text-xs text-green-700">Publiés</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-xl font-bold text-orange-600">{stats.unpublished_articles}</div>
          <div className="text-xs text-orange-700">Non publiés</div>
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
export default function IntelligentLanguages() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [platformId, setPlatformId] = useState(Number(searchParams.get('platform_id')) || 1);

  // Fetch data
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['coverage', 'languages', platformId],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: Record<string, LanguageStats> }>(
        '/admin/coverage/intelligent/languages',
        { params: { platform_id: platformId } }
      );
      return response.data.data;
    },
    staleTime: 60000,
  });

  const handlePlatformChange = (id: number) => {
    setPlatformId(id);
    setSearchParams({ platform_id: String(id) });
  };

  const languagesList = data ? Object.values(data).sort((a, b) => b.coverage_percent - a.coverage_percent) : [];
  
  // Summary stats
  const summary = languagesList.length > 0 ? {
    totalArticles: languagesList.reduce((sum, l) => sum + l.total_articles, 0),
    totalPublished: languagesList.reduce((sum, l) => sum + l.published_articles, 0),
    avgCoverage: languagesList.reduce((sum, l) => sum + l.coverage_percent, 0) / languagesList.length,
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/coverage/intelligent')}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Languages className="w-6 h-6 text-purple-600" />
                  Couverture par Langue
                </h1>
                <p className="text-xs text-slate-500">9 langues × 197 pays</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {PLATFORMS.map(platform => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => !platform.disabled && handlePlatformChange(platform.id)}
                    disabled={platform.disabled}
                    className={`
                      px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2
                      ${platformId === platform.id
                        ? `bg-gradient-to-r ${platform.gradient} text-white shadow-lg`
                        : platform.disabled
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {platform.name}
                  </button>
                );
              })}
              
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 ml-2"
              >
                <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
          </div>
        ) : (
          <>
            {/* Summary */}
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
                  <div className="text-3xl font-bold text-slate-800">{summary.totalArticles}</div>
                  <div className="text-sm text-slate-500">Articles totaux</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{summary.totalPublished}</div>
                  <div className="text-sm text-slate-500">Articles publiés</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(summary.avgCoverage)}`}>
                    {summary.avgCoverage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-slate-500">Couverture moyenne</div>
                </div>
              </div>
            )}

            {/* Languages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {languagesList.map((lang, index) => (
                <LanguageCard key={lang.language_code} stats={lang} index={index} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
