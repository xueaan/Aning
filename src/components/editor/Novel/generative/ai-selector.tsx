import { Command, CommandInput } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ArrowUp, X } from "lucide-react";
import { useEditor } from "novel";
import { useState } from "react";
import { useAppStore } from "@/stores";
import { callAiService } from "@/utils/aiUtils";
import AISelectorCommands from "./ai-selector-commands";

interface AISelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AISelector = ({ open: _open, onOpenChange }: AISelectorProps) => {
  const { editor } = useEditor();
  const { aiConfig } = useAppStore();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasCompletion, setHasCompletion] = useState(false);

  if (!editor) return null;

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    
    const currentProvider = aiConfig.currentProvider;
    const config = aiConfig[currentProvider];
    
    if (!config.enabled || !config.apiKey) {
      console.warn("AI service not configured or disabled");
      return;
    }

    setIsLoading(true);
    try {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      );
      
      const prompt = selectedText 
        ? `根据以下文本进行操作：${inputValue}\n\n原文：${selectedText}`
        : inputValue;
        
      const result = await callAiService(currentProvider, config, prompt);
      
      if (result.success && result.content) {
        // 插入 AI 生成的内容
        if (selectedText) {
          // 如果有选中文本，替换它
          editor.chain().focus().deleteSelection().insertContent(result.content).run();
        } else {
          // 否则在当前位置插入
          editor.chain().focus().insertContent(result.content).run();
        }
        setHasCompletion(true);
      } else {
        console.error("AI request failed:", result.message);
      }
    } catch (error) {
      console.error("AI request error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommand = async (value: string, _option: string) => {
    const currentProvider = aiConfig.currentProvider;
    const config = aiConfig[currentProvider];
    
    if (!config.enabled || !config.apiKey) {
      console.warn("AI service not configured or disabled");
      return;
    }

    setIsLoading(true);
    try {
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      );
      
      if (!selectedText) {
        console.warn("No text selected for AI command");
        setIsLoading(false);
        return;
      }

      const prompt = `请${value}以下文本：\n\n${selectedText}`;
      const result = await callAiService(currentProvider, config, prompt);
      
      if (result.success && result.content) {
        // 替换选中文本
        editor.chain().focus().deleteSelection().insertContent(result.content).run();
        setHasCompletion(true);
      } else {
        console.error("AI command failed:", result.message);
      }
    } catch (error) {
      console.error("AI command error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Command className="w-[350px]">
      {isLoading && (
        <div className="flex h-12 w-full items-center px-4 text-sm font-medium text-muted-foreground text-purple-500">
          <div className="mr-2 h-4 w-4 shrink-0">✨</div>
          AI正在思考
          <div className="ml-2 mt-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />
          </div>
        </div>
      )}
      {!isLoading && (
        <>
          <div className="relative">
            <CommandInput 
              value={inputValue} 
              onValueChange={setInputValue}
              autoFocus
              placeholder={hasCompletion ? "告诉AI接下来要做什么" : "让AI编辑或生成内容..."}
            />
            <Button 
              size="icon"
              className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-purple-500 hover:bg-purple-900"
              onClick={handleSubmit}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </div>
          {!hasCompletion && (
            <AISelectorCommands onSelect={handleCommand} />
          )}
          {hasCompletion && (
            <div className="flex items-center justify-between p-2">
              <span className="text-sm text-muted-foreground">AI处理完成</span>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => {
                  setHasCompletion(false);
                  setInputValue("");
                  onOpenChange(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </Command>
  );
};







