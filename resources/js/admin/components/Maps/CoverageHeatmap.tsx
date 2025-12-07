import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { Layer, PathOptions } from 'leaflet';
import { cn } from '@/lib/utils';
import { Select } from '@/components/ui/Select';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import 'leaflet/dist/leaflet.css';

export interface CountryCoverage {
  countryCode: string;
  countryName: string;
  coverage: number;
  articles: number;
  flag?: string;
}

export interface CoverageHeatmapProps {
  data: CountryCoverage[];
  onCountryClick?: (country: CountryCoverage) => void;
  selectedCountry?: string | null;
  height?: number | string;
  className?: string;
}

function getCoverageColor(coverage: number): string {
  if (coverage === 0) return '#f3f4f6';
  if (coverage < 20) return '#fecaca';
  if (coverage < 40) return '#fde68a';
  if (coverage < 60) return '#fef08a';
  if (coverage < 80) return '#bbf7d0';
  return '#86efac';
}

function getCoverageBorderColor(coverage: number): string {
  if (coverage === 0) return '#9ca3af';
  if (coverage < 20) return '#ef4444';
  if (coverage < 40) return '#f59e0b';
  if (coverage < 60) return '#eab308';
  if (coverage < 80) return '#22c55e';
  return '#16a34a';
}

const REGIONS = [
  { value: 'all', label: 'Monde entier' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asie' },
  { value: 'africa', label: 'Afrique' },
  { value: 'americas', label: 'Amériques' },
  { value: 'oceania', label: 'Océanie' },
];

const REGION_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  all: { center: [20, 0], zoom: 2 },
  europe: { center: [50, 10], zoom: 4 },
  asia: { center: [35, 100], zoom: 3 },
  africa: { center: [0, 20], zoom: 3 },
  americas: { center: [10, -80], zoom: 3 },
  oceania: { center: [-25, 135], zoom: 4 },
};

const GEOJSON_URLS = [
  '/data/countries.geojson',
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
];

function MapController({ region }: { region: string }) {
  const map = useMap();
  
  useEffect(() => {
    const config = REGION_CENTERS[region] || REGION_CENTERS.all;
    map.flyTo(config.center, config.zoom, { duration: 1 });
  }, [region, map]);
  
  return null;
}

export function CoverageHeatmap({
  data,
  onCountryClick,
  selectedCountry,
  height = 500,
  className,
}: CoverageHeatmapProps) {
  const [geoData, setGeoData] = useState<any>(null);
  const [region, setRegion] = useState('all');
  const [hoveredCountry, setHoveredCountry] = useState<CountryCoverage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const coverageMap = useMemo(() => {
    const map = new Map<string, CountryCoverage>();
    data.forEach((c) => map.set(c.countryCode.toUpperCase(), c));
    return map;
  }, [data]);

  const loadGeoData = async () => {
    setIsLoading(true);
    setError(null);

    const cached = sessionStorage.getItem('countries_geojson');
    if (cached) {
      try {
        setGeoData(JSON.parse(cached));
        setIsLoading(false);
        return;
      } catch {
        sessionStorage.removeItem('countries_geojson');
      }
    }

    for (const url of GEOJSON_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        
        if (!data.features || !Array.isArray(data.features)) {
          throw new Error('Invalid GeoJSON format');
        }

        try {
          sessionStorage.setItem('countries_geojson', JSON.stringify(data));
        } catch {
          // sessionStorage full
        }

        setGeoData(data);
        setIsLoading(false);
        return;
      } catch (err) {
        console.warn(`Failed to load from ${url}:`, err);
        continue;
      }
    }

    setError('Impossible de charger les données de la carte. Vérifiez votre connexion.');
    setIsLoading(false);
  };

  useEffect(() => {
    loadGeoData();
  }, []);

  const getCountryStyle = (feature: GeoJSON.Feature): PathOptions => {
    const countryCode = feature.properties?.ISO_A2?.toUpperCase();
    const coverage = coverageMap.get(countryCode);
    const coveragePercent = coverage?.coverage || 0;
    const isSelected = selectedCountry === countryCode;

    return {
      fillColor: getCoverageColor(coveragePercent),
      weight: isSelected ? 3 : 1,
      opacity: 1,
      color: isSelected ? '#3b82f6' : getCoverageBorderColor(coveragePercent),
      fillOpacity: isSelected ? 0.9 : 0.7,
    };
  };

  const onEachCountry = (feature: GeoJSON.Feature, layer: Layer) => {
    const countryCode = feature.properties?.ISO_A2?.toUpperCase();
    const countryName = feature.properties?.ADMIN;
    const coverage = coverageMap.get(countryCode);

    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          weight: 2,
          fillOpacity: 0.9,
        });
        setHoveredCountry(coverage || {
          countryCode,
          countryName,
          coverage: 0,
          articles: 0,
        });
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle(getCountryStyle(feature));
        setHoveredCountry(null);
      },
      click: () => {
        if (coverage && onCountryClick) {
          onCountryClick(coverage);
        }
      },
    });

    layer.bindTooltip(`${countryName}: ${coverage?.coverage || 0}%`, {
      permanent: false,
      direction: 'center',
    });
  };

  const legend = [
    { color: '#f3f4f6', label: '0%' },
    { color: '#fecaca', label: '1-20%' },
    { color: '#fde68a', label: '20-40%' },
    { color: '#fef08a', label: '40-60%' },
    { color: '#bbf7d0', label: '60-80%' },
    { color: '#86efac', label: '80-100%' },
  ];

  const stats = useMemo(() => {
    const total = data.length;
    const covered = data.filter((c) => c.coverage > 0).length;
    const avgCoverage = data.reduce((sum, c) => sum + c.coverage, 0) / total || 0;
    return { total, covered, avgCoverage };
  }, [data]);

  if (isLoading) {
    return (
      <div 
        className={cn('relative flex items-center justify-center bg-gray-100 rounded-lg', className)}
        style={{ height }}
      >
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={cn('relative flex items-center justify-center bg-gray-100 rounded-lg', className)}
        style={{ height }}
      >
        <div className="text-center p-6">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-gray-700 mb-4">{error}</p>
          <Button onClick={loadGeoData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute top-4 left-4 z-[1000] flex gap-2">
        <Select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="w-40 bg-white"
        >
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
        <div className="text-sm space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Pays couverts</span>
            <span className="font-bold">{stats.covered}/{stats.total}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Moyenne</span>
            <span className="font-bold">{stats.avgCoverage.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {hoveredCountry && (
        <div className="absolute bottom-20 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 min-w-[200px]">
          <p className="font-semibold text-gray-900">
            {hoveredCountry.flag} {hoveredCountry.countryName}
          </p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coverage</span>
              <span className="font-bold">{hoveredCountry.coverage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Articles</span>
              <span className="font-bold">{hoveredCountry.articles}</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
        <p className="text-xs font-medium text-gray-700 mb-2">Couverture</p>
        <div className="flex gap-1">
          {legend.map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <div
                className="w-6 h-4 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] text-gray-500 mt-1">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height, width: '100%' }}
        scrollWheelZoom={true}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        <MapController region={region} />
        {geoData && (
          <GeoJSON
            data={geoData}
            style={getCountryStyle}
            onEachFeature={onEachCountry}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default CoverageHeatmap;
