
interface CountryCoverage {
  country_code: string;
  country_name: string;
  article_count: number;
  coverage_percentage: number;
}

interface Props {
  data: CountryCoverage[];
}

export function CoverageHeatmap({ data }: Props) {
  const getColorIntensity = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 60) return 'bg-green-400';
    if (percentage >= 40) return 'bg-yellow-400';
    if (percentage >= 20) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="space-y-2">
      {data.map((country) => (
        <div key={country.country_code} className="flex items-center gap-3">
          <div className="w-32 text-sm font-medium truncate">
            {country.country_name}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
            <div
              className={`h-full ${getColorIntensity(country.coverage_percentage)} transition-all duration-300 flex items-center justify-center text-white text-xs font-medium`}
              style={{ width: `${country.coverage_percentage}%` }}
            >
              {country.coverage_percentage > 15 && `${country.coverage_percentage.toFixed(0)}%`}
            </div>
          </div>
          <div className="w-20 text-sm text-gray-600 text-right">
            {country.article_count} articles
          </div>
        </div>
      ))}
    </div>
  );
}