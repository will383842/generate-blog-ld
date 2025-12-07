import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ValidationResult {
  field: string;
  status: 'valid' | 'invalid' | 'warning';
  message: string;
}

interface KnowledgeValidatorProps {
  results?: ValidationResult[];
  isValidating?: boolean;
  className?: string;
}

export function KnowledgeValidator({
  results = [],
  isValidating,
  className,
}: KnowledgeValidatorProps) {
  if (isValidating) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Validation en cours...</span>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <p className="text-center text-gray-500 dark:text-gray-400 py-4">
          Aucune validation effectuee
        </p>
      </Card>
    );
  }

  const statusIcon = {
    valid: <CheckCircle className="w-5 h-5 text-green-500" />,
    invalid: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  };

  const statusBadge = {
    valid: <Badge variant="success">Valide</Badge>,
    invalid: <Badge variant="destructive">Invalide</Badge>,
    warning: <Badge variant="warning">Attention</Badge>,
  };

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Resultats de validation</h3>
      <div className="space-y-3">
        {results.map((result, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            {statusIcon[result.status]}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{result.field}</span>
                {statusBadge[result.status]}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{result.message}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default KnowledgeValidator;
