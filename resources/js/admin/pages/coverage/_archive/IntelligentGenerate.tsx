/**
 * INTELLIGENT COVERAGE - GENERATE CONTENT
 * Page de génération automatique de contenu manquant
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Zap, Globe, ChevronLeft, RefreshCw, Scale, Briefcase, Sparkles,
  CheckCircle2, XCircle, Clock, AlertCircle, Play, Pause, RotateCcw, User
} from 'lucide-react';

// Types
interface CountryItem {
  id: number;
  name: string;
  code: string;
  region: string;
  overall_score: number;
  priority_score: number;
}

interface GenerationTask {
  country_id: number;
  country_name: string;
  country_code: string;
  language: string;
  content_type: string;
  priority: number;
  estimated_cost: number;
  status: string;
}

interface GenerationPlan {
  tasks: GenerationTask[];
  summary: {
    total_tasks: number;
    total_countries: number;
    total_languages: number;
    estimated_cost: number;
    estimated_duration: string;
  };
}

// Platforms
const PLATFORMS = [
  { id: 1, code: 'sos-expat', name: 'SOS-Expat', icon: Scale, gradient: 'from-red-500 to-orange-500' },
  { id: 2, code: 'ulixai', name: 'Ulixai', icon: Briefcase, gradient: 'from-blue-500 to-indigo-500' },
];

// Languages
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

// Content types
const CONTENT_TYPES = [
  { code: 'recruitment', name: 'Recrutement', icon: '👔', description: 'Articles pour prestataires' },
  { code: 'awareness', name: 'Notoriété', icon: '📈', description: 'Pillar articles, comparatifs' },
  { code: 'founder', name: 'Fondateur', icon: '👤', description: 'Articles Williams Jullin' },
];

// Helper
function getCountryFlag(code: string): string {
  if (!code || code.length !== 2) return '🌍';
  const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Main Component
export default function IntelligentGenerate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [platformId, setPlatformId] = useState(Number(searchParams.get('platform_id')) || 1);
  
  // Selection states
  const [selectedCountries, setSelectedCountries] = useState<number[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['fr', 'en']);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(['recruitment']);
  
  // Generation state
  const [generationPlan, setGenerationPlan] = useState<GenerationPlan | null>(null);

  // Fetch priority countries
  const { data: countries, isLoading } = useQuery({
    queryKey: ['coverage', 'countries', 'priority', platformId],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: CountryItem[] }>(
        '/admin/coverage/intelligent/countries',
        { params: { platform_id: platformId, sort_by: 'priority_score', sort_order: 'desc', per_page: 50 } }
      );
      return response.data.data;
    },
  });

  // Prepare generation mutation
  const prepareMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post<{ success: boolean; data: GenerationPlan }>(
        '/admin/coverage/intelligent/generate',
        {
          platform_id: platformId,
          country_ids: selectedCountries,
          languages: selectedLanguages,
          content_types: selectedContentTypes,
        }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      setGenerationPlan(data);
    },
  });

  const toggleCountry = (id: number) => {
    setSelectedCountries(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    );
  };

  const toggleContentType = (code: string) => {
    setSelectedContentTypes(prev =>
      prev.includes(code) ? prev.filter(t => t !== code) : [...prev, code]
    );
  };

  const selectTopCountries = (count: number) => {
    if (countries) {
      setSelectedCountries(countries.slice(0, count).map(c => c.id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
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
                  <Zap className="w-6 h-6 text-green-600" />
                  Génération de Contenu
                </h1>
                <p className="text-xs text-slate-500">Générer automatiquement le contenu manquant</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {PLATFORMS.map(platform => {
                const Icon = platform.icon;
                return (
                  <button
                    key={platform.id}
                    onClick={() => setPlatformId(platform.id)}
                    className={`
                      px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2
                      ${platformId === platform.id
                        ? `bg-gradient-to-r ${platform.gradient} text-white shadow-lg`
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {platform.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Types */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-4">Types de contenu</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CONTENT_TYPES.map(type => (
                  <button
                    key={type.code}
                    onClick={() => toggleContentType(type.code)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedContentTypes.includes(type.code)
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <div className="font-medium text-slate-700">{type.name}</div>
                    <div className="text-xs text-slate-500">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-4">Langues cibles</h3>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => toggleLanguage(lang.code)}
                    className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 transition-all ${
                      selectedLanguages.includes(lang.code)
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Countries */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">Pays prioritaires</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => selectTopCountries(10)}
                    className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                  >
                    Top 10
                  </button>
                  <button
                    onClick={() => selectTopCountries(20)}
                    className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                  >
                    Top 20
                  </button>
                  <button
                    onClick={() => setSelectedCountries([])}
                    className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                  >
                    Effacer
                  </button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {countries?.map(country => (
                    <button
                      key={country.id}
                      onClick={() => toggleCountry(country.id)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        selectedCountries.includes(country.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{getCountryFlag(country.code)}</span>
                        <span className="text-sm font-medium truncate">{country.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Summary */}
          <div className="space-y-6">
            {/* Selection Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-4">Résumé de sélection</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Pays sélectionnés</span>
                  <span className="font-bold text-slate-800">{selectedCountries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Langues</span>
                  <span className="font-bold text-slate-800">{selectedLanguages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Types de contenu</span>
                  <span className="font-bold text-slate-800">{selectedContentTypes.length}</span>
                </div>
              </div>

              <button
                onClick={() => prepareMutation.mutate()}
                disabled={
                  selectedCountries.length === 0 ||
                  selectedLanguages.length === 0 ||
                  selectedContentTypes.length === 0 ||
                  prepareMutation.isPending
                }
                className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {prepareMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Préparation...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Préparer la génération
                  </>
                )}
              </button>
            </div>

            {/* Generation Plan */}
            {generationPlan && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
              >
                <h3 className="font-semibold text-slate-700 mb-4">Plan de génération</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tâches totales</span>
                    <span className="font-bold text-slate-800">{generationPlan.summary.total_tasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Coût estimé</span>
                    <span className="font-bold text-green-600">${generationPlan.summary.estimated_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Durée estimée</span>
                    <span className="font-bold text-slate-800">{generationPlan.summary.estimated_duration}</span>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
                  {generationPlan.tasks.slice(0, 20).map((task, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs p-2 bg-slate-50 rounded">
                      <span>{getCountryFlag(task.country_code)}</span>
                      <span className="truncate flex-1">{task.country_name}</span>
                      <span className="text-slate-500">{task.language.toUpperCase()}</span>
                      <span className="text-slate-500">{task.content_type}</span>
                    </div>
                  ))}
                  {generationPlan.tasks.length > 20 && (
                    <div className="text-center text-xs text-slate-500 py-2">
                      +{generationPlan.tasks.length - 20} autres tâches...
                    </div>
                  )}
                </div>

                <button
                  className="w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Démarrer la génération
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
