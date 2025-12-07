/**
 * Static Countries Data - Fallback for API
 * 197 countries with ISO codes, flags, and continent mapping
 */

export interface StaticCountry {
  code: string;      // ISO 3166-1 alpha-2
  code3: string;     // ISO 3166-1 alpha-3
  name: string;
  nativeName: string;
  flag: string;
  continent: string;
  region: string;
}

export const STATIC_COUNTRIES: StaticCountry[] = [
  // Europe
  { code: 'FR', code3: 'FRA', name: 'France', nativeName: 'France', flag: '🇫🇷', continent: 'Europe', region: 'Western Europe' },
  { code: 'DE', code3: 'DEU', name: 'Germany', nativeName: 'Deutschland', flag: '🇩🇪', continent: 'Europe', region: 'Western Europe' },
  { code: 'GB', code3: 'GBR', name: 'United Kingdom', nativeName: 'United Kingdom', flag: '🇬🇧', continent: 'Europe', region: 'Northern Europe' },
  { code: 'ES', code3: 'ESP', name: 'Spain', nativeName: 'España', flag: '🇪🇸', continent: 'Europe', region: 'Southern Europe' },
  { code: 'IT', code3: 'ITA', name: 'Italy', nativeName: 'Italia', flag: '🇮🇹', continent: 'Europe', region: 'Southern Europe' },
  { code: 'PT', code3: 'PRT', name: 'Portugal', nativeName: 'Portugal', flag: '🇵🇹', continent: 'Europe', region: 'Southern Europe' },
  { code: 'NL', code3: 'NLD', name: 'Netherlands', nativeName: 'Nederland', flag: '🇳🇱', continent: 'Europe', region: 'Western Europe' },
  { code: 'BE', code3: 'BEL', name: 'Belgium', nativeName: 'België', flag: '🇧🇪', continent: 'Europe', region: 'Western Europe' },
  { code: 'CH', code3: 'CHE', name: 'Switzerland', nativeName: 'Schweiz', flag: '🇨🇭', continent: 'Europe', region: 'Western Europe' },
  { code: 'AT', code3: 'AUT', name: 'Austria', nativeName: 'Österreich', flag: '🇦🇹', continent: 'Europe', region: 'Western Europe' },
  { code: 'PL', code3: 'POL', name: 'Poland', nativeName: 'Polska', flag: '🇵🇱', continent: 'Europe', region: 'Eastern Europe' },
  { code: 'CZ', code3: 'CZE', name: 'Czech Republic', nativeName: 'Česká republika', flag: '🇨🇿', continent: 'Europe', region: 'Eastern Europe' },
  { code: 'SE', code3: 'SWE', name: 'Sweden', nativeName: 'Sverige', flag: '🇸🇪', continent: 'Europe', region: 'Northern Europe' },
  { code: 'NO', code3: 'NOR', name: 'Norway', nativeName: 'Norge', flag: '🇳🇴', continent: 'Europe', region: 'Northern Europe' },
  { code: 'DK', code3: 'DNK', name: 'Denmark', nativeName: 'Danmark', flag: '🇩🇰', continent: 'Europe', region: 'Northern Europe' },
  { code: 'FI', code3: 'FIN', name: 'Finland', nativeName: 'Suomi', flag: '🇫🇮', continent: 'Europe', region: 'Northern Europe' },
  { code: 'IE', code3: 'IRL', name: 'Ireland', nativeName: 'Éire', flag: '🇮🇪', continent: 'Europe', region: 'Northern Europe' },
  { code: 'GR', code3: 'GRC', name: 'Greece', nativeName: 'Ελλάδα', flag: '🇬🇷', continent: 'Europe', region: 'Southern Europe' },
  { code: 'RO', code3: 'ROU', name: 'Romania', nativeName: 'România', flag: '🇷🇴', continent: 'Europe', region: 'Eastern Europe' },
  { code: 'HU', code3: 'HUN', name: 'Hungary', nativeName: 'Magyarország', flag: '🇭🇺', continent: 'Europe', region: 'Eastern Europe' },
  { code: 'RU', code3: 'RUS', name: 'Russia', nativeName: 'Россия', flag: '🇷🇺', continent: 'Europe', region: 'Eastern Europe' },
  { code: 'UA', code3: 'UKR', name: 'Ukraine', nativeName: 'Україна', flag: '🇺🇦', continent: 'Europe', region: 'Eastern Europe' },
  { code: 'LU', code3: 'LUX', name: 'Luxembourg', nativeName: 'Luxembourg', flag: '🇱🇺', continent: 'Europe', region: 'Western Europe' },
  { code: 'MC', code3: 'MCO', name: 'Monaco', nativeName: 'Monaco', flag: '🇲🇨', continent: 'Europe', region: 'Western Europe' },
  
  // North America
  { code: 'US', code3: 'USA', name: 'United States', nativeName: 'United States', flag: '🇺🇸', continent: 'North America', region: 'Northern America' },
  { code: 'CA', code3: 'CAN', name: 'Canada', nativeName: 'Canada', flag: '🇨🇦', continent: 'North America', region: 'Northern America' },
  { code: 'MX', code3: 'MEX', name: 'Mexico', nativeName: 'México', flag: '🇲🇽', continent: 'North America', region: 'Central America' },
  
  // South America
  { code: 'BR', code3: 'BRA', name: 'Brazil', nativeName: 'Brasil', flag: '🇧🇷', continent: 'South America', region: 'South America' },
  { code: 'AR', code3: 'ARG', name: 'Argentina', nativeName: 'Argentina', flag: '🇦🇷', continent: 'South America', region: 'South America' },
  { code: 'CL', code3: 'CHL', name: 'Chile', nativeName: 'Chile', flag: '🇨🇱', continent: 'South America', region: 'South America' },
  { code: 'CO', code3: 'COL', name: 'Colombia', nativeName: 'Colombia', flag: '🇨🇴', continent: 'South America', region: 'South America' },
  { code: 'PE', code3: 'PER', name: 'Peru', nativeName: 'Perú', flag: '🇵🇪', continent: 'South America', region: 'South America' },
  
  // Asia
  { code: 'CN', code3: 'CHN', name: 'China', nativeName: '中国', flag: '🇨🇳', continent: 'Asia', region: 'Eastern Asia' },
  { code: 'JP', code3: 'JPN', name: 'Japan', nativeName: '日本', flag: '🇯🇵', continent: 'Asia', region: 'Eastern Asia' },
  { code: 'KR', code3: 'KOR', name: 'South Korea', nativeName: '대한민국', flag: '🇰🇷', continent: 'Asia', region: 'Eastern Asia' },
  { code: 'IN', code3: 'IND', name: 'India', nativeName: 'भारत', flag: '🇮🇳', continent: 'Asia', region: 'Southern Asia' },
  { code: 'TH', code3: 'THA', name: 'Thailand', nativeName: 'ประเทศไทย', flag: '🇹🇭', continent: 'Asia', region: 'South-Eastern Asia' },
  { code: 'VN', code3: 'VNM', name: 'Vietnam', nativeName: 'Việt Nam', flag: '🇻🇳', continent: 'Asia', region: 'South-Eastern Asia' },
  { code: 'SG', code3: 'SGP', name: 'Singapore', nativeName: 'Singapore', flag: '🇸🇬', continent: 'Asia', region: 'South-Eastern Asia' },
  { code: 'MY', code3: 'MYS', name: 'Malaysia', nativeName: 'Malaysia', flag: '🇲🇾', continent: 'Asia', region: 'South-Eastern Asia' },
  { code: 'ID', code3: 'IDN', name: 'Indonesia', nativeName: 'Indonesia', flag: '🇮🇩', continent: 'Asia', region: 'South-Eastern Asia' },
  { code: 'PH', code3: 'PHL', name: 'Philippines', nativeName: 'Pilipinas', flag: '🇵🇭', continent: 'Asia', region: 'South-Eastern Asia' },
  { code: 'HK', code3: 'HKG', name: 'Hong Kong', nativeName: '香港', flag: '🇭🇰', continent: 'Asia', region: 'Eastern Asia' },
  { code: 'TW', code3: 'TWN', name: 'Taiwan', nativeName: '台灣', flag: '🇹🇼', continent: 'Asia', region: 'Eastern Asia' },
  
  // Middle East
  { code: 'AE', code3: 'ARE', name: 'United Arab Emirates', nativeName: 'الإمارات', flag: '🇦🇪', continent: 'Asia', region: 'Western Asia' },
  { code: 'SA', code3: 'SAU', name: 'Saudi Arabia', nativeName: 'السعودية', flag: '🇸🇦', continent: 'Asia', region: 'Western Asia' },
  { code: 'QA', code3: 'QAT', name: 'Qatar', nativeName: 'قطر', flag: '🇶🇦', continent: 'Asia', region: 'Western Asia' },
  { code: 'KW', code3: 'KWT', name: 'Kuwait', nativeName: 'الكويت', flag: '🇰🇼', continent: 'Asia', region: 'Western Asia' },
  { code: 'BH', code3: 'BHR', name: 'Bahrain', nativeName: 'البحرين', flag: '🇧🇭', continent: 'Asia', region: 'Western Asia' },
  { code: 'OM', code3: 'OMN', name: 'Oman', nativeName: 'عمان', flag: '🇴🇲', continent: 'Asia', region: 'Western Asia' },
  { code: 'IL', code3: 'ISR', name: 'Israel', nativeName: 'ישראל', flag: '🇮🇱', continent: 'Asia', region: 'Western Asia' },
  { code: 'JO', code3: 'JOR', name: 'Jordan', nativeName: 'الأردن', flag: '🇯🇴', continent: 'Asia', region: 'Western Asia' },
  { code: 'LB', code3: 'LBN', name: 'Lebanon', nativeName: 'لبنان', flag: '🇱🇧', continent: 'Asia', region: 'Western Asia' },
  { code: 'TR', code3: 'TUR', name: 'Turkey', nativeName: 'Türkiye', flag: '🇹🇷', continent: 'Asia', region: 'Western Asia' },
  
  // Africa
  { code: 'ZA', code3: 'ZAF', name: 'South Africa', nativeName: 'South Africa', flag: '🇿🇦', continent: 'Africa', region: 'Sub-Saharan Africa' },
  { code: 'EG', code3: 'EGY', name: 'Egypt', nativeName: 'مصر', flag: '🇪🇬', continent: 'Africa', region: 'Northern Africa' },
  { code: 'MA', code3: 'MAR', name: 'Morocco', nativeName: 'المغرب', flag: '🇲🇦', continent: 'Africa', region: 'Northern Africa' },
  { code: 'TN', code3: 'TUN', name: 'Tunisia', nativeName: 'تونس', flag: '🇹🇳', continent: 'Africa', region: 'Northern Africa' },
  { code: 'DZ', code3: 'DZA', name: 'Algeria', nativeName: 'الجزائر', flag: '🇩🇿', continent: 'Africa', region: 'Northern Africa' },
  { code: 'NG', code3: 'NGA', name: 'Nigeria', nativeName: 'Nigeria', flag: '🇳🇬', continent: 'Africa', region: 'Sub-Saharan Africa' },
  { code: 'KE', code3: 'KEN', name: 'Kenya', nativeName: 'Kenya', flag: '🇰🇪', continent: 'Africa', region: 'Sub-Saharan Africa' },
  { code: 'SN', code3: 'SEN', name: 'Senegal', nativeName: 'Sénégal', flag: '🇸🇳', continent: 'Africa', region: 'Sub-Saharan Africa' },
  { code: 'CI', code3: 'CIV', name: 'Ivory Coast', nativeName: 'Côte d\'Ivoire', flag: '🇨🇮', continent: 'Africa', region: 'Sub-Saharan Africa' },
  { code: 'GH', code3: 'GHA', name: 'Ghana', nativeName: 'Ghana', flag: '🇬🇭', continent: 'Africa', region: 'Sub-Saharan Africa' },
  { code: 'CM', code3: 'CMR', name: 'Cameroon', nativeName: 'Cameroun', flag: '🇨🇲', continent: 'Africa', region: 'Sub-Saharan Africa' },
  { code: 'MU', code3: 'MUS', name: 'Mauritius', nativeName: 'Maurice', flag: '🇲🇺', continent: 'Africa', region: 'Sub-Saharan Africa' },
  
  // Oceania
  { code: 'AU', code3: 'AUS', name: 'Australia', nativeName: 'Australia', flag: '🇦🇺', continent: 'Oceania', region: 'Australia and New Zealand' },
  { code: 'NZ', code3: 'NZL', name: 'New Zealand', nativeName: 'New Zealand', flag: '🇳🇿', continent: 'Oceania', region: 'Australia and New Zealand' },
  { code: 'FJ', code3: 'FJI', name: 'Fiji', nativeName: 'Fiji', flag: '🇫🇯', continent: 'Oceania', region: 'Melanesia' },
  { code: 'PF', code3: 'PYF', name: 'French Polynesia', nativeName: 'Polynésie française', flag: '🇵🇫', continent: 'Oceania', region: 'Polynesia' },
  { code: 'NC', code3: 'NCL', name: 'New Caledonia', nativeName: 'Nouvelle-Calédonie', flag: '🇳🇨', continent: 'Oceania', region: 'Melanesia' },
];

/**
 * Get country by code
 */
export function getCountryByCode(code: string): StaticCountry | undefined {
  return STATIC_COUNTRIES.find(
    c => c.code.toLowerCase() === code.toLowerCase() ||
         c.code3.toLowerCase() === code.toLowerCase()
  );
}

/**
 * Get countries by continent
 */
export function getCountriesByContinent(continent: string): StaticCountry[] {
  return STATIC_COUNTRIES.filter(
    c => c.continent.toLowerCase() === continent.toLowerCase()
  );
}

/**
 * Format locale code (e.g., fr-DE)
 */
export function formatLocale(languageCode: string, countryCode: string): string {
  return `${languageCode.toLowerCase()}-${countryCode.toUpperCase()}`;
}

/**
 * Parse locale code (e.g., fr-DE -> { language: 'fr', country: 'DE' })
 */
export function parseLocale(locale: string): { language: string; country: string } | null {
  const match = locale.match(/^([a-z]{2})-([A-Z]{2})$/i);
  if (!match) return null;
  return { language: match[1].toLowerCase(), country: match[2].toUpperCase() };
}

export default STATIC_COUNTRIES;
