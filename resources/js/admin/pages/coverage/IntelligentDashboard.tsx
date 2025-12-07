import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Globe, Users, TrendingUp, Target, Sparkles, RefreshCw,
  ChevronRight, AlertCircle, CheckCircle2, Clock, Zap,
  Languages, Grid3X3, List, Scale, Briefcase, User, Map
} from 'lucide-react';

// Types
interface DashboardData {
  platform_id: number;
  total_countries: number;
  summary: {
    average_recruitment: number;
    average_awareness: number;
    average_founder: number;
    average_overall: number;
    total_published: number;
    total_unpublished: number;
    total_countries: number;
  };
  distribution: {
    excellent: number;
    good: number;
    partial: number;
    minimal: number;
    missing: number;
  };
  top_countries: CountryItem[];
  priority_countries: CountryItem[];
}

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

interface Platform {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  disabled?: boolean;
}

// Platforms configuration
const PLATFORMS: Platform[] = [
  {
    id: 1,
    code: 'sos-expat',
    name: 'SOS-Expat',
    description: 'Assistance juridique urgente',
    icon: <Scale className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-gradient-to-br from-red-500 to-orange-500',
    borderColor: 'border-red-500',
  },
  {
    id: 2,
    code: 'ulixai',
    name: 'Ulixai',
    description: 'Marketplace services',
    icon: <Briefcase className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    borderColor: 'border-blue-500',
  },
  {
    id: 3,
    code: 'ulysse',
    name: 'Ulysse.AI',
    description: 'Assistant IA',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-gradient-to-br from-purple-500 to-pink-500',
    borderColor: 'border-purple-500',
    disabled: true,
  },
];

// Helper functions
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
const ScoreCard: React.FC<{
  title: string;
  score: number;
  icon: React.ReactNode;
  subtitle?: string;
  color?: string;
}> = ({ title, score, icon, subtitle, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl shadow-sm border border-slate-200 p-4"
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-slate-600">{title}</span>
      <div className={`p-2 rounded-lg ${color || 'bg-slate-100'}`}>
        {icon}
      </div>
    </div>
    <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
      {score.toFixed(1)}%
    </div>
    {subtitle && (
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    )}
    <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-full ${getScoreBgColor(score)}`}
      />
    </div>
  </motion.div>
);

const DistributionChart: React.FC<{ distribution: DashboardData['distribution'] }> = ({ distribution }) => {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  
  const segments = [
    { key: 'excellent', label: 'Excellent', count: distribution.excellent, color: 'bg-green-500', textColor: 'text-green-600' },
    { key: 'good', label: 'Bon', count: distribution.good, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
    { key: 'partial', label: 'Partiel', count: distribution.partial, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { key: 'minimal', label: 'Minimal', count: distribution.minimal, color: 'bg-orange-500', textColor: 'text-orange-600' },
    { key: 'missing', label: 'Manquant', count: distribution.missing, color: 'bg-red-500', textColor: 'text-red-600' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Répartition par niveau</h3>
      
      {/* Bar */}
      <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex mb-4">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.key}
            initial={{ width: 0 }}
            animate={{ width: `${(seg.count / total) * 100}%` }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className={`h-full ${seg.color}`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-5 gap-2">
        {segments.map(seg => (
          <div key={seg.key} className="text-center">
            <div className={`text-lg font-bold ${seg.textColor}`}>{seg.count}</div>
            <div className="text-xs text-slate-500">{seg.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const QuickActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  color: 'blue' | 'red' | 'purple' | 'green' | 'indigo' | 'orange' | 'cyan';
}> = ({ icon, label, description, onClick, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
    orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    cyan: 'from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700',
  };
  
  const iconColors = {
    blue: 'bg-blue-400/30',
    red: 'bg-red-400/30',
    purple: 'bg-purple-400/30',
    green: 'bg-green-400/30',
    indigo: 'bg-indigo-400/30',
    orange: 'bg-orange-400/30',
    cyan: 'bg-cyan-400/30',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full p-4 rounded-xl bg-gradient-to-r ${colors[color]} text-white text-left transition-all shadow-lg hover:shadow-xl`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconColors[color]}`}>
          {icon}
        </div>
        <div>
          <div className="font-semibold">{label}</div>
          <div className="text-xs opacity-80">{description}</div>
        </div>
        <ChevronRight className="w-5 h-5 ml-auto opacity-60" />
      </div>
    </motion.button>
  );
};

const CountryRow: React.FC<{ country: CountryItem; onClick: () => void }> = ({ country, onClick }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 transition-all"
  >
    <span className="text-2xl">{getCountryFlag(country.code)}</span>
    <div className="flex-1 min-w-0">
      <div className="font-medium text-slate-800 truncate">{country.name}</div>
      <div className="text-xs text-slate-500">{country.region}</div>
    </div>
    <div className="flex items-center gap-4">
      {/* Mini progress bars */}
      <div className="hidden sm:flex flex-col gap-1 w-20">
        <div className="flex items-center gap-1">
          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" 
              style={{ width: `${country.recruitment_score}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 w-6">{country.recruitment_score.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500" 
              style={{ width: `${country.awareness_score}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 w-6">{country.awareness_score.toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-500" 
              style={{ width: `${country.founder_score}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 w-6">{country.founder_score.toFixed(0)}%</span>
        </div>
      </div>
      <div className={`text-lg font-bold ${getScoreColor(country.overall_score)}`}>
        {country.overall_score.toFixed(1)}%
      </div>
    </div>
  </motion.div>
);

// Main Component
export default function IntelligentDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(
    PLATFORMS.find(p => p.id === Number(searchParams.get('platform_id'))) || PLATFORMS[0]
  );

  // Fetch dashboard data
  const { data, isLoading, refetch, isFetching, isError, error } = useQuery({
    queryKey: ['coverage', 'dashboard', selectedPlatform.id],
    queryFn: async () => {
      const response = await axios.get<{ success: boolean; data: DashboardData }>(
        '/admin/coverage/intelligent/dashboard',
        { params: { platform_id: selectedPlatform.id } }
      );
      if (!response.data.success) {
        throw new Error('Erreur lors du chargement des données');
      }
      return response.data.data;
    },
    staleTime: 60000,
    retry: 2,
  });

  // Handle platform change
  const handlePlatformChange = (platform: Platform) => {
    if (platform.disabled) return;
    setSelectedPlatform(platform);
    setSearchParams({ platform_id: String(platform.id) });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Globe className="w-7 h-7 text-indigo-600" />
                Couverture Intelligente
              </h1>
              <p className="text-sm text-slate-500">
                197 pays × 9 langues × Toutes spécialités + Thème Fondateur
              </p>
            </div>

            {/* Platform Selector */}
            <div className="flex items-center gap-2">
              {PLATFORMS.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => handlePlatformChange(platform)}
                  disabled={platform.disabled}
                  className={`
                    px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2
                    ${selectedPlatform.id === platform.id
                      ? `${platform.bgColor} text-white shadow-lg`
                      : platform.disabled
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }
                  `}
                >
                  {platform.icon}
                  <span>{platform.name}</span>
                  {platform.disabled && <span className="text-xs">(Bientôt)</span>}
                </button>
              ))}
              
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                aria-label="Actualiser les données"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors ml-2"
              >
                <RefreshCw className={`w-5 h-5 text-slate-600 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            <p className="text-slate-500 text-sm">Chargement des données de couverture...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="w-16 h-16 text-red-400" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800">Erreur de chargement</h3>
              <p className="text-slate-500 text-sm mt-1">
                {(error as Error)?.message || 'Une erreur est survenue lors du chargement des données'}
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
        ) : data ? (
          <div className="space-y-6">
            {/* Score Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ScoreCard
                title="Score Global"
                score={data.summary.average_overall}
                icon={<Target className="w-5 h-5 text-indigo-600" />}
                subtitle={`${data.total_countries} pays analysés`}
                color="bg-indigo-100"
              />
              <ScoreCard
                title="Recrutement"
                score={data.summary.average_recruitment}
                icon={<Users className="w-5 h-5 text-blue-600" />}
                subtitle="Prestataires"
                color="bg-blue-100"
              />
              <ScoreCard
                title="Notoriété"
                score={data.summary.average_awareness}
                icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
                subtitle="SEO & Contenu"
                color="bg-purple-100"
              />
              <ScoreCard
                title="Fondateur"
                score={data.summary.average_founder}
                icon={<User className="w-5 h-5 text-amber-600" />}
                subtitle="Williams Jullin"
                color="bg-amber-100"
              />
            </div>

            {/* Articles Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Articles</h3>
                  <div className="flex items-center gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-2xl font-bold text-green-600">{data.summary.total_published}</span>
                      <span className="text-sm text-slate-500">publiés</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-500" />
                      <span className="text-2xl font-bold text-orange-600">{data.summary.total_unpublished}</span>
                      <span className="text-sm text-slate-500">non publiés</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Seuls les articles publiés sont comptabilisés</div>
                </div>
              </div>
            </div>

            {/* Distribution */}
            <DistributionChart distribution={data.distribution} />

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={<Grid3X3 className="w-5 h-5" />}
                label="🌍 Vue Grille 197 pays"
                description="Toutes les progress bars d'un coup"
                onClick={() => navigate(`/coverage/intelligent/grid?platform_id=${selectedPlatform.id}`)}
                color="indigo"
              />
              <QuickActionButton
                icon={<Map className="w-5 h-5" />}
                label="🗺️ Carte Mondiale"
                description="Vue géographique interactive"
                onClick={() => navigate(`/coverage/intelligent/map?platform_id=${selectedPlatform.id}`)}
                color="cyan"
              />
              <QuickActionButton
                icon={<List className="w-5 h-5" />}
                label="Liste des pays"
                description="Filtres avancés & tri"
                onClick={() => navigate(`/coverage/intelligent/countries?platform_id=${selectedPlatform.id}`)}
                color="blue"
              />
              <QuickActionButton
                icon={<User className="w-5 h-5" />}
                label="Thème Williams Jullin"
                description="Fondateur - Cross-platform"
                onClick={() => navigate('/coverage/intelligent/founder')}
                color="orange"
              />
              <QuickActionButton
                icon={<Languages className="w-5 h-5" />}
                label="Vue par langue"
                description="9 langues × 197 pays"
                onClick={() => navigate(`/coverage/intelligent/languages?platform_id=${selectedPlatform.id}`)}
                color="purple"
              />
              <QuickActionButton
                icon={<Zap className="w-5 h-5" />}
                label="Générer contenu"
                description="IA automatique"
                onClick={() => navigate(`/coverage/intelligent/generate?platform_id=${selectedPlatform.id}`)}
                color="green"
              />
              <QuickActionButton
                icon={<AlertCircle className="w-5 h-5" />}
                label="Pays prioritaires"
                description={`${data.priority_countries.length} pays à traiter`}
                onClick={() => navigate(`/coverage/intelligent/countries?platform_id=${selectedPlatform.id}&status=missing`)}
                color="red"
              />
            </div>

            {/* Countries Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Countries */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Meilleurs pays
                  </h3>
                  <button
                    onClick={() => navigate(`/coverage/intelligent/countries?platform_id=${selectedPlatform.id}&sort_by=overall_score&sort_order=desc`)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Voir tout
                  </button>
                </div>
                <div className="space-y-1">
                  {data.top_countries.slice(0, 5).map(country => (
                    <CountryRow
                      key={country.id}
                      country={country}
                      onClick={() => navigate(`/coverage/intelligent/countries/${country.id}?platform_id=${selectedPlatform.id}`)}
                    />
                  ))}
                </div>
              </div>

              {/* Priority Countries */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Pays prioritaires
                  </h3>
                  <button
                    onClick={() => navigate(`/coverage/intelligent/countries?platform_id=${selectedPlatform.id}&sort_by=priority_score&sort_order=desc`)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Voir tout
                  </button>
                </div>
                <div className="space-y-1">
                  {data.priority_countries.slice(0, 5).map(country => (
                    <CountryRow
                      key={country.id}
                      country={country}
                      onClick={() => navigate(`/coverage/intelligent/countries/${country.id}?platform_id=${selectedPlatform.id}`)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-indigo-500" />
                <span className="text-slate-600">Recrutement</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-500 to-pink-500" />
                <span className="text-slate-600">Notoriété</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-500 to-yellow-500" />
                <span className="text-slate-600">Fondateur (Williams Jullin)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="w-12 h-12 text-slate-400" />
            <p className="text-slate-600">Aucune donnée disponible</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
