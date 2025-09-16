import { EditorBubble, useEditor } from 'novel';
import { Fragment, type ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { useAppStore } from '@/stores';
import { getAiProviderStatus } from '@/utils/aiUtils';
import { AISelector } from './ai-selector';

interface GenerativeMenuSwitchProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerativeMenuSwitch = ({ children, open, onOpenChange }: GenerativeMenuSwitchProps) => {
  const { editor } = useEditor();
  const { aiConfig } = useAppStore();
  const currentProvider = aiConfig.currentProvider;
  const currentConfig = aiConfig[currentProvider];
  const aiStatus = getAiProviderStatus(currentConfig);

  useEffect(() => {
    if (!open && editor) {
      // 清除 AI 高亮
      editor.chain().unsetHighlight().run();
    }
  }, [open, editor]);

  return (
    <EditorBubble
      tippyOptions={{
        placement: open ? 'bottom-start' : 'top',
        onHidden: () => {
          onOpenChange(false);
          if (editor) {
            editor.chain().unsetHighlight().run();
          }
        },
      }}
      className="feather-glass-deco flex items-center gap-1 px-3 py-2 rounded-xl"
    >
      {open && <AISelector open={open} onOpenChange={onOpenChange} />}
      {!open && (
        <Fragment>
          <Button
            className={`h-8 w-8 p-0 bg-transparent border-none hover:bg-transparent ${
              aiStatus === 'ready' ? 'text-purple-500 hover:text-purple-600' : 'text-gray-400'
            }`}
            variant="ghost"
            onClick={() => aiStatus === 'ready' && onOpenChange(true)}
            disabled={aiStatus !== 'ready'}
            title={aiStatus === 'ready' ? '询问AI' : 'AI未配置或未启用'}
          >
            <Bot className="h-4 w-4" />
          </Button>
          {children}
        </Fragment>
      )}
    </EditorBubble>
  );
};

export default GenerativeMenuSwitch;
