import {
  Check,
  CheckSquare,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  type LucideIcon,
  Text
} from "lucide-react";
import { EditorBubbleItem, useEditor } from "novel";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type SelectorItem = {
  name: string;
  icon: LucideIcon;
  command: (editor: ReturnType<typeof useEditor>["editor"]) => void;
  isActive: (editor: ReturnType<typeof useEditor>["editor"]) => boolean;
};

const items: SelectorItem[] = [
  {
    name: "正文",
    icon: Text,
    command: (editor) => editor?.chain().focus().setParagraph().run(),
    isActive: (editor) =>
      (editor?.isActive("paragraph") && !editor?.isActive("bulletList") && !editor?.isActive("orderedList")) ?? false
  },
  {
    name: "标题 1",
    icon: Heading1,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor?.isActive("heading", { level: 1 }) ?? false
  },
  {
    name: "标题 2",
    icon: Heading2,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor?.isActive("heading", { level: 2 }) ?? false
  },
  {
    name: "标题 3",
    icon: Heading3,
    command: (editor) => editor?.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor?.isActive("heading", { level: 3 }) ?? false
  },
  {
    name: "待办列表",
    icon: CheckSquare,
    command: (editor) => editor?.chain().focus().toggleTaskList().run(),
    isActive: (editor) => editor?.isActive("taskItem") ?? false
  },
  {
    name: "无序列表",
    icon: List,
    command: (editor) => editor?.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor?.isActive("bulletList") ?? false
  },
  {
    name: "有序列表",
    icon: ListOrdered,
    command: (editor) => editor?.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor?.isActive("orderedList") ?? false
  },
  {
    name: "引用",
    icon: Quote,
    command: (editor) => editor?.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor?.isActive("blockquote") ?? false
  },
  {
    name: "代码",
    icon: Code,
    command: (editor) => editor?.chain().focus().toggleCodeBlock().run(),
    isActive: (editor) => editor?.isActive("codeBlock") ?? false
  },
];

interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NodeSelector = ({ open, onOpenChange }: NodeSelectorProps) => {
  const { editor } = useEditor();
  if (!editor) return null;
  
  const activeItem = items.filter((item) => item.isActive(editor)).pop() ?? {
    name: "Multiple"
  };

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" 
            className="gap-2 rounded-none border-none hover:bg-accent focus:ring-0">
          <span className="whitespace-nowrap text-sm">{activeItem.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent sideOffset={5} align="start" 
            className="w-48 p-1">
        {items.map((item) => (
          <EditorBubbleItem key={item.name} onSelect={(editor) => {
              item.command(editor);
              onOpenChange(false);
            }}
            className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1 text-sm hover:bg-accent">
            <div className="flex items-center space-x-2">
              <div className="rounded-sm border p-1">
                <item.icon className="h-3 w-3" />
              </div>
              <span>{item.name}</span>
            </div>
            {activeItem.name === item.name && <Check className="h-4 w-4" />}
          </EditorBubbleItem>
        ))}
      </PopoverContent>
    </Popover>
  );
};