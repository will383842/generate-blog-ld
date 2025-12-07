import React from 'react';
import { Select } from '@/components/ui/Select';

interface KnowledgeTypeFilterProps {
  value: string;
  onChange: (value: string) => void;
  types?: string[];
  className?: string;
}

export function KnowledgeTypeFilter({
  value,
  onChange,
  types = ['all', 'article', 'faq', 'guide', 'glossary', 'tutorial'],
  className,
}: KnowledgeTypeFilterProps) {
  const typeLabels: Record<string, string> = {
    all: 'Tous les types',
    article: 'Article',
    faq: 'FAQ',
    guide: 'Guide',
    glossary: 'Glossaire',
    tutorial: 'Tutoriel',
  };

  return (
    <Select
      value={value}
      onChange={onChange}
      className={className}
    >
      {types.map((type) => (
        <option key={type} value={type}>
          {typeLabels[type] || type}
        </option>
      ))}
    </Select>
  );
}

export default KnowledgeTypeFilter;
