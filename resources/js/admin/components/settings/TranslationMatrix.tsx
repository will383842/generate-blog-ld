import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface TranslationStatus {
  key: string;
  languages: Record<string, 'complete' | 'pending' | 'missing'>;
}

interface TranslationMatrixProps {
  items: TranslationStatus[];
  languages: string[];
  onTranslate?: (key: string, language: string) => void;
  className?: string;
}

export function TranslationMatrix({
  items,
  languages,
  onTranslate,
  className,
}: TranslationMatrixProps) {
  const statusIcon = {
    complete: <CheckCircle className="w-4 h-4 text-green-500" />,
    pending: <Clock className="w-4 h-4 text-yellow-500" />,
    missing: <XCircle className="w-4 h-4 text-red-500" />,
  };

  if (items.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          Aucun element a traduire
        </p>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                Cle
              </th>
              {languages.map((lang) => (
                <th
                  key={lang}
                  className="px-4 py-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300 uppercase"
                >
                  {lang}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <tr key={item.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                  {item.key}
                </td>
                {languages.map((lang) => (
                  <td key={lang} className="px-4 py-3 text-center">
                    <button
                      onClick={() => onTranslate?.(item.key, lang)}
                      className="inline-flex items-center justify-center"
                      title={`Status: ${item.languages[lang] || 'missing'}`}
                    >
                      {statusIcon[item.languages[lang] || 'missing']}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default TranslationMatrix;
