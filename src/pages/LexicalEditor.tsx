import React from 'react';
import { LexicalEditor } from '@/components/editor/lexical/LexicalEditor';

export const LexicalEditorPage: React.FC = () => {
  return (
    <div className="w-full h-full">
      <LexicalEditor />
    </div>
  );
};

export default LexicalEditorPage;

