/**
 * Generation Wizard Page
 * Full page wizard for content generation
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GenerationWizard, type GenerationWizardData } from '@/components/generation/GenerationWizard';
import { useToast } from '@/hooks/useToast';
import api from '@/utils/api';

const DRAFT_KEY = 'generation-wizard-draft';

export function GenerationWizardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [hasDraft, setHasDraft] = useState(false);
  const [initialData, setInitialData] = useState<Partial<GenerationWizardData> | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setHasDraft(true);
        // Show restore dialog
        if (window.confirm('Un brouillon a été trouvé. Voulez-vous le restaurer ?')) {
          setInitialData(parsed);
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, []);

  // Auto-save draft
  const saveDraft = (data: GenerationWizardData) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  };

  const handleSubmit = async (data: GenerationWizardData) => {
    setIsSubmitting(true);
    try {
      // Utilise l'endpoint correct /api/generate/bulk
      const response = await api.post('/generate/bulk', {
        platform_id: data.platformId,
        countries: data.countries,
        themes: data.themeId ? [data.themeId] : [],
        languages: data.languages,
        content_type: data.contentType,
        template_id: data.templateId,
        options: data.options,
      });

      const result = response.data;

      // Clear draft
      localStorage.removeItem(DRAFT_KEY);

      toast.success(`${result.count || result.data?.count || 0} jobs ajoutés à la queue`);
      
      // ✅ CORRIGÉ: Navigation sans /admin (basename déjà défini dans router)
      navigate('/generation/queue');
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosError.response?.data?.message || axiosError.message || 'Erreur inconnue';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Voulez-vous sauvegarder ce brouillon ?')) {
      toast.success('Brouillon sauvegardé');
    } else {
      localStorage.removeItem(DRAFT_KEY);
    }
    // ✅ CORRIGÉ: Navigation sans /admin
    navigate('/generation');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Nouvelle génération</h1>
            <p className="text-sm text-muted-foreground">
              Assistant de création de contenu
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => saveDraft(initialData as GenerationWizardData)}>
          <Save className="w-4 h-4 mr-2" />
          Sauvegarder
        </Button>
      </div>

      {/* Wizard */}
      <div className="flex-1 overflow-hidden">
        <GenerationWizard
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          className="h-full"
        />
      </div>
    </div>
  );
}

export default GenerationWizardPage;