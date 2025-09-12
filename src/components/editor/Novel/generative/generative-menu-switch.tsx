import { EditorBubble, useEditor } from "novel";
import { Fragment, type ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Magic from "../ui/icons/magic";
import { useAppStore } from "@/stores";
import { getAiProviderStatus } from "@/utils/aiUtils";
import { AISelector } from "./ai-selector";

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
        placement: open ? "bottom-start" : "top",
        onHidden: () => {
          onOpenChange(false);
          if (editor) {
            editor.chain().unsetHighlight().run();
          }
        }
      }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      {open && <AISelector open={open} onOpenChange={onOpenChange} />}
      {!open && (
        <Fragment>
          <Button 
            className={`gap-1 rounded-none transition-colors ${
              aiStatus === 'ready' ? 'text-purple-500 hover:text-purple-600' : 'text-gray-400'
            }`}
            variant="ghost"
            onClick={() => aiStatus === 'ready' && onOpenChange(true)} 
            size="sm"
            disabled={aiStatus !== 'ready'} 
            title={aiStatus === 'ready' ? '询问AI' : 'AI未配置或未启用'}
          >
            <Magic className="h-5 w-5" />
            询问AI
            {aiStatus === 'ready' && (
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full ml-1" />
            )}
          </Button>
          {children}
        </Fragment>
      )}
    </EditorBubble>
  );
};

export default GenerativeMenuSwitch;