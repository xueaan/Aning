import React from 'react';
import { KnowledgeLayout } from './components/KnowledgeLayout';

interface KnowledgeProps {
  onSidebarToggle?: (show: boolean) => void;
  searchQuery?: string;
}

export const Knowledge: React.FC<KnowledgeProps> = ({
  onSidebarToggle: _onSidebarToggle,
  searchQuery,
}) => {
  return <KnowledgeLayout searchQuery={searchQuery} />;
};

export default Knowledge;
