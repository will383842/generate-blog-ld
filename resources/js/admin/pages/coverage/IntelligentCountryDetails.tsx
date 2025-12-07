/**
 * INTELLIGENT COVERAGE - COUNTRY DETAILS
 * Détails complets d'un pays avec onglets Recrutement, Notoriété, Fondateur
 */

import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ChevronLeft, Globe, Users, TrendingUp, User, Scale, Briefcase,
  CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, Zap,
  ChevronDown, ChevronRight, Languages
} from 'lucide-react';
import type { RecruitmentBreakdown, AwarenessBreakdown, FounderBreakdown } from '@/types/intelligentCoverage';

// Types
interface CountryDetails {
  country_id: number;
  country_name: string;
  country_code: string;
  region: string;
  recruitment_score: number;
  awareness_score: number;
  founder_score: number;
  overall_score: number;
  recruitment_breakdown: RecruitmentBreakdown;
  awareness_breakdown: AwarenessBreakdown;
  founder_breakdown: FounderBreakdown;
  language_scores: Record<string, LanguageScore>;
  total_articles: number;
  published_articles: number;
  unpublished_articles: number;
  total_targets: number;
  completed_targets: number;
  missing_targets: number;
  priority_score: number;
  recommendations: Recommendation[];
  status: string;
  recent_articles: Article[];
}

interface LanguageScore {
  language_id: number;
  language_code: string;
  language_name: string;
  total_articles: number;
  published_articles: number;
  unpublished_articles: number;
  score: number;
  status: string;
}

interface Recommendation {
  type: string;
  priority: number;
  action: string;
  message: string;
  impact: string;
}

interface Article {
  id: number;
  title: string;
  type: string;
  language: string;
  status: string;
  is_published: boolean;
  created_at: string;
}

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

// Score Card Component
const ScoreCard: React.FC<{
  title: string;
  score: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}> = ({ title, score, icon, color, description }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-slate-600">{title}</span>
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
    </div>
    <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
      {score.toFixed(1)}%
    </div>
    {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8 }}
        className={`h-full ${getScoreBgColor(score)}`}
      />
    </div>
  </div>
);

// Language Row Component
const LanguageRow: React.FC<{
  lang: typeof LANGUAGES[0];
  score?: LanguageScore;
  founderData?: { sos_expat: { completed: boolean }; ulixai: { completed: boolean } };
}> = ({ lang, score, founderData }) => (
  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
    <span className="text-2xl">{lang.flag}</span>
    <div className="flex-1">
      <div className="font-medium text-slate-700">{lang.name}</div>
      <div className="text-xs text-slate-500">{lang.code.toUpperCase()}</div>
    </div>
    
    {score && (
      <div className="flex items-center gap-4">
        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full ${getScoreBgColor(score.score)}`} style={{ width: `${score.score}%` }} />
        </div>
        <span className={`font-bold ${getScoreColor(score.score)}`}>{score.score.toFixed(0)}%</span>
        <span className="text-xs text-slate-500">
          {score.published_articles}/{score.total_articles} articles
        </span>
      </div>
    )}
    
    {founderData && (
      <div className="flex items-center gap-2">
        <div className={`px-2 py-1 rounded text-xs font-medium ${founderData.sos_expat.completed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          SOS-Expat: {founderData.sos_expat.completed ? '✓' : '✗'}
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${founderData.ulixai.completed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          Ulixai: {founderData.ulixai.completed ? '✓' : '✗'}
        </div>
      </div>
    )}
  </div>
);

// Main Component
export default function IntelligentCountryDetails() {
  const { countryId } = useParams<{ countryId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const platformId = Number(searchParams.get('platform_id')) || 1;
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  // Fetch data
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['coverage', 'country', platformId, countryId],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: CountryDetails }>(
        `/api/coverage/intelligent/countries/${countryId}`,
        { params: { platform_id: platformId } }
      );
      return response.data.data;
    },
    enabled: !!countryId,
    staleTime: 60000,
  });

  const tabs = [
    { id: 'overview', label: 'Vue générale', icon: Globe },
    { id: 'recruitment', label: 'Recrutement', icon: Users },
    { id: 'awareness', label: 'Notoriété', icon: TrendingUp },
    { id: 'founder', label: 'Fondateur', icon: User },
    { id: 'languages', label: 'Langues', icon: Languages },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Pays non trouvé</p>
          <button
            onClick={() => navigate('/coverage/intelligent/countries')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Retour à la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/coverage/intelligent/countries?platform_id=${platformId}`)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{getCountryFlag(data.country_code)}</span>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{data.country_name}</h1>
                  <p className="text-sm text-slate-500">{data.region} • {data.country_code}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                data.status === 'excellent' ? 'bg-green-100 text-green-700' :
                data.status === 'good' ? 'bg-emerald-100 text-emerald-700' :
                data.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                data.status === 'minimal' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {getStatusLabel(data.status)}
              </div>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200"
              >
                <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => navigate(`/coverage/intelligent/generate?platform_id=${platformId}&country_id=${countryId}`)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Générer
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Score Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ScoreCard
                title="Score Global"
                score={data.overall_score}
                icon={<Globe className="w-5 h-5 text-indigo-600" />}
                color="bg-indigo-100"
                description={`${data.completed_targets}/${data.total_targets} cibles complétées`}
              />
              <ScoreCard
                title="Recrutement"
                score={data.recruitment_score}
                icon={<Users className="w-5 h-5 text-blue-600" />}
                color="bg-blue-100"
                description="Prestataires"
              />
              <ScoreCard
                title="Notoriété"
                score={data.awareness_score}
                icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
                color="bg-purple-100"
                description="SEO & Contenu"
              />
              <ScoreCard
                title="Fondateur"
                score={data.founder_score}
                icon={<User className="w-5 h-5 text-amber-600" />}
                color="bg-amber-100"
                description="Williams Jullin"
              />
            </div>

            {/* Articles Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-4">Articles</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{data.published_articles}</div>
                  <div className="text-sm text-green-700">Publiés</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{data.unpublished_articles}</div>
                  <div className="text-sm text-orange-700">Non publiés</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{data.missing_targets}</div>
                  <div className="text-sm text-red-700">Manquants</div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {data.recommendations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-700 mb-4">Recommandations</h3>
                <div className="space-y-2">
                  {data.recommendations.slice(0, 5).map((rec, i) => (
                    <div key={i} className={`p-3 rounded-lg flex items-center gap-3 ${
                      rec.type === 'critical' ? 'bg-red-50' :
                      rec.type === 'high' ? 'bg-orange-50' :
                      rec.type === 'medium' ? 'bg-yellow-50' : 'bg-slate-50'
                    }`}>
                      <AlertCircle className={`w-5 h-5 ${
                        rec.type === 'critical' ? 'text-red-500' :
                        rec.type === 'high' ? 'text-orange-500' :
                        rec.type === 'medium' ? 'text-yellow-500' : 'text-slate-500'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium text-slate-700">{rec.message}</div>
                        <div className="text-xs text-slate-500">{rec.impact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Languages Tab */}
        {activeTab === 'languages' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-4">Couverture par langue</h3>
            <div className="space-y-2">
              {LANGUAGES.map(lang => (
                <LanguageRow
                  key={lang.code}
                  lang={lang}
                  score={data.language_scores[lang.code]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Founder Tab */}
        {activeTab === 'founder' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-800">Williams Jullin - Fondateur</h3>
                  <p className="text-sm text-amber-700">
                    Articles sur le fondateur pour SOS-Expat et Ulixai combinés
                  </p>
                </div>
                <div className={`ml-auto text-3xl font-bold ${getScoreColor(data.founder_score)}`}>
                  {data.founder_score.toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-700 mb-4">Statut par langue</h3>
              <div className="space-y-2">
                {LANGUAGES.map(lang => {
                  const founderData = data.founder_breakdown?.[lang.code];
                  return (
                    <LanguageRow
                      key={lang.code}
                      lang={lang}
                      founderData={founderData}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recruitment Tab */}
        {activeTab === 'recruitment' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-4">
              Recrutement - Score: {data.recruitment_score.toFixed(1)}%
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Détails des spécialités et services disponibles dans les données de breakdown.
            </p>
            <pre className="bg-slate-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
              {JSON.stringify(data.recruitment_breakdown, null, 2)}
            </pre>
          </div>
        )}

        {/* Awareness Tab */}
        {activeTab === 'awareness' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-700 mb-4">
              Notoriété - Score: {data.awareness_score.toFixed(1)}%
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Pillar articles, comparatifs et landing pages.
            </p>
            <pre className="bg-slate-50 p-4 rounded-lg text-xs overflow-auto max-h-96">
              {JSON.stringify(data.awareness_breakdown, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
