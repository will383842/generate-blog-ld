import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';

import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useContentTemplates } from '@/hooks/useContentTemplates';

const TemplateImport: React.FC = () => {
  const navigate = useNavigate();
  const { importTemplate, loading } = useContentTemplates();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.json')) {
      setError('Veuillez sélectionner un fichier JSON');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setPreview(data);
      } catch (err) {
        setError('Fichier JSON invalide');
        setPreview(null);
      }
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleImport = async () => {
    if (!preview) return;

    const result = await importTemplate(preview);
    if (result) {
      setSuccess(true);
      setTimeout(() => {
        navigate(`/settings/templates/${result.id}`);
      }, 1500);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = {
        target: { files: [droppedFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(fakeEvent);
    }
  }, [handleFileChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importer un template"
        description="Importez un template depuis un fichier JSON"
      />

      {error && (
        <Alert variant="error">
          <AlertCircle className="w-4 h-4" />
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <CheckCircle className="w-4 h-4" />
          Template importé avec succès ! Redirection...
        </Alert>
      )}

      <Card className="p-6">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 transition-colors"
        >
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Glissez un fichier JSON ici
            </p>
            <p className="text-sm text-gray-500 mb-4">
              ou cliquez pour sélectionner un fichier
            </p>
            <Button variant="outline" type="button">
              Sélectionner un fichier
            </Button>
          </label>
        </div>

        {/* File info */}
        {file && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center gap-4">
            <FileJson className="w-8 h-8 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Preview */}
      {preview && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Aperçu du template</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium">{preview.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nom</p>
                <p className="font-medium">{preview.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Langue</p>
                <p className="font-medium">{preview.language_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Format</p>
                <p className="font-medium">{preview.output_format || 'html'}</p>
              </div>
            </div>

            {preview.description && (
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p>{preview.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-500 mb-2">System Prompt (extrait)</p>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-hidden max-h-32">
                {preview.system_prompt?.substring(0, 300)}
                {preview.system_prompt?.length > 300 && '...'}
              </pre>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-gray-500">Mots cible</p>
                <p className="font-medium">{preview.word_count_target || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-gray-500">FAQ</p>
                <p className="font-medium">{preview.faq_count || 0}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <p className="text-gray-500">Modèle</p>
                <p className="font-medium">{preview.model || 'gpt-4o'}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importer le template
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TemplateImport;
