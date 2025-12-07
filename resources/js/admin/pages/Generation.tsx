import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useGenerateArticle, useGenerationQueue } from '@/hooks/useGeneration';
import { useCountries } from '@/hooks/useCountries';
import { useThemes } from '@/hooks/useThemes';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from '@/hooks/useToast';
import type { Country, Theme } from '@/types/common';

export default function Generation() {
  const [formData, setFormData] = useState({
    platform_id: 1,
    country_id: '',
    theme_id: '',
    provider_type_id: '',
    language_code: 'fr',
  });

  const { data: countriesData, isLoading: loadingCountries } = useCountries();
  const { data: themesData, isLoading: loadingThemes } = useThemes();
  const { data: queueData } = useGenerationQueue();
  const generateArticle = useGenerateArticle();

  // ✅ CORRECTION : Extraction sécurisée des données
  const countries = Array.isArray(countriesData) 
    ? countriesData 
    : Array.isArray(countriesData?.data) 
      ? countriesData.data 
      : [];

  const themes = Array.isArray(themesData) 
    ? themesData 
    : Array.isArray(themesData?.data) 
      ? themesData.data 
      : [];

  const queue = queueData?.data || queueData || {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.country_id || !formData.theme_id) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    generateArticle.mutate({
      platform_id: formData.platform_id,
      country_id: parseInt(formData.country_id),
      theme_id: parseInt(formData.theme_id),
      provider_type_id: parseInt(formData.provider_type_id) || 1,
      language_code: formData.language_code,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Génération de Contenu</h1>
        <p className="text-gray-600 mt-2">Créez un nouvel article avec l'IA</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Nouveau Article</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Plateforme */}
                <div>
                  <label className="block text-sm font-medium mb-2">Plateforme</label>
                  <Select
                    value={formData.platform_id.toString()}
                    onChange={(e) => setFormData({ ...formData, platform_id: parseInt(e.target.value) })}
                  >
                    <option value="1">SOS-Expat</option>
                    <option value="2">Ulixai</option>
                    <option value="3">Ulysse.AI</option>
                  </Select>
                </div>

                {/* Pays */}
                <div>
                  <label className="block text-sm font-medium mb-2">Pays *</label>
                  {loadingCountries ? (
                    <LoadingSpinner />
                  ) : countries.length > 0 ? (
                    <Select
                      value={formData.country_id}
                      onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                      required
                    >
                      <option value="">Sélectionnez un pays</option>
                      {countries.map((country: Country) => (
                        <option key={country.id} value={country.id}>
                          {country.flag_emoji || ''} {country.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <p className="text-sm text-red-600">Aucun pays disponible</p>
                  )}
                </div>

                {/* Thème */}
                <div>
                  <label className="block text-sm font-medium mb-2">Thème *</label>
                  {loadingThemes ? (
                    <LoadingSpinner />
                  ) : themes.length > 0 ? (
                    <Select
                      value={formData.theme_id}
                      onChange={(e) => setFormData({ ...formData, theme_id: e.target.value })}
                      required
                    >
                      <option value="">Sélectionnez un thème</option>
                      {themes.map((theme: Theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.icon || ''} {theme.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <p className="text-sm text-red-600">Aucun thème disponible</p>
                  )}
                </div>

                {/* Langue */}
                <div>
                  <label className="block text-sm font-medium mb-2">Langue</label>
                  <Select
                    value={formData.language_code}
                    onChange={(e) => setFormData({ ...formData, language_code: e.target.value })}
                  >
                    <option value="fr">🇫🇷 Français</option>
                    <option value="en">🇬🇧 English</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="de">🇩🇪 Deutsch</option>
                    <option value="pt">🇵🇹 Português</option>
                    <option value="ru">🇷🇺 Русский</option>
                    <option value="zh">🇨🇳 中文</option>
                    <option value="ar">🇸🇦 العربية</option>
                    <option value="hi">🇮🇳 हिन्दी</option>
                  </Select>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={generateArticle.isPending}
                >
                  {generateArticle.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Génération en cours...
                    </>
                  ) : (
                    'Générer l\'article'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Queue Status */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>File d'attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">En attente</span>
                  <span className="font-bold">{queue.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">En cours</span>
                  <span className="font-bold text-blue-600">{queue.processing || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Complétés</span>
                  <span className="font-bold text-green-600">{queue.completed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Erreurs</span>
                  <span className="font-bold text-red-600">{queue.failed || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coût estimé */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Coût estimé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">~$0.15</p>
                <p className="text-sm text-gray-500 mt-1">par article</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}