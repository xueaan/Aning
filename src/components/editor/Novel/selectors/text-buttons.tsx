import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bold, Italic, Underline, Code } from "lucide-react";
import { EditorBubbleItem, useEditor } from "novel";

export type SelectorItem = {
  name: string;
  isActive: (editor: any) => boolean;
  command: (editor: any) => void;
  icon: React.ComponentType<{ className?: string }>;
};

export const TextButtons = () => {
  const { editor } = useEditor();
  if (!editor) return null;
  
  const items: SelectorItem[] = [
    {
      name: "bold",
      isActive: (editor) => editor.isActive("bold"),
      command: (editor) => editor.chain().focus().toggleBold().run(),
      icon: Bold
    },
    {
      name: "italic",
      isActive: (editor) => editor.isActive("italic"),
      command: (editor) => editor.chain().focus().toggleItalic().run(),
      icon: Italic
    },
    {
      name: "underline",
      isActive: (editor) => editor.isActive("underline"),
      command: (editor) => editor.chain().focus().toggleUnderline().run(),
      icon: Underline
    },
    {
      name: "code",
      isActive: (editor) => editor.isActive("code"),
      command: (editor) => editor.chain().focus().toggleCode().run(),
      icon: Code,
    },
  ];
  
  return (
    <div className="flex">
      {items.map((item) => (
        <EditorBubbleItem key={item.name} onSelect={(editor) => {
            item.command(editor);
          }}>
          <Button size="sm"
            className="h-8 w-8 p-0 bg-transparent border-none hover:bg-transparent" variant="ghost" type="button">
            <item.icon className={cn("h-4 w-4", {
                "text-blue-500": item.isActive(editor)
              })}
            />
          </Button>
        </EditorBubbleItem>
      ))}
    </div>
  );
};