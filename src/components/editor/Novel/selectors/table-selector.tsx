import { Table, Plus, Minus, Merge, Split, Trash2, ChevronDown } from 'lucide-react';
import { EditorBubbleItem, useEditor } from 'novel';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface TableAction {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  command: (editor: any) => void;
  isActive?: (editor: any) => boolean;
  disabled?: (editor: any) => boolean;
}

const TABLE_ACTIONS: TableAction[] = [
  {
    name: '在上方添加行',
    icon: Plus,
    command: (editor) => editor.chain().focus().addRowBefore().run(),
    disabled: (editor) => !editor.can().addRowBefore(),
  },
  {
    name: '在下方添加行',
    icon: Plus,
    command: (editor) => editor.chain().focus().addRowAfter().run(),
    disabled: (editor) => !editor.can().addRowAfter(),
  },
  {
    name: '删除当前行',
    icon: Minus,
    command: (editor) => editor.chain().focus().deleteRow().run(),
    disabled: (editor) => !editor.can().deleteRow(),
  },
  {
    name: '在左侧添加列',
    icon: Plus,
    command: (editor) => editor.chain().focus().addColumnBefore().run(),
    disabled: (editor) => !editor.can().addColumnBefore(),
  },
  {
    name: '在右侧添加列',
    icon: Plus,
    command: (editor) => editor.chain().focus().addColumnAfter().run(),
    disabled: (editor) => !editor.can().addColumnAfter(),
  },
  {
    name: '删除当前列',
    icon: Minus,
    command: (editor) => editor.chain().focus().deleteColumn().run(),
    disabled: (editor) => !editor.can().deleteColumn(),
  },
  {
    name: '合并单元格',
    icon: Merge,
    command: (editor) => editor.chain().focus().mergeCells().run(),
    disabled: (editor) => !editor.can().mergeCells(),
  },
  {
    name: '拆分单元格',
    icon: Split,
    command: (editor) => editor.chain().focus().splitCell().run(),
    disabled: (editor) => !editor.can().splitCell(),
  },
  {
    name: '删除表格',
    icon: Trash2,
    command: (editor) => editor.chain().focus().deleteTable().run(),
    disabled: (editor) => !editor.can().deleteTable(),
  },
];

interface TableSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TableSelector = ({ open, onOpenChange }: TableSelectorProps) => {
  const { editor } = useEditor();

  if (!editor) return null;

  // 检查是否在表格中或选中了表格内容
  const isInTable =
    editor.isActive('table') ||
    editor.isActive('tableRow') ||
    editor.isActive('tableCell') ||
    editor.isActive('tableHeader');

  // 如果不在表格中，不显示表格选择器
  if (!isInTable) return null;

  return (
    <Popover modal={true} open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          className="h-8 w-8 p-0 bg-transparent border-none hover:bg-transparent"
          variant="ghost"
        >
          <Table className="h-4 w-4" />
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        sideOffset={5}
        className="my-1 flex max-h-80 w-56 flex-col overflow-hidden overflow-y-auto rounded border p-1 shadow-xl"
        align="start"
      >
        <div className="flex flex-col">
          <div className="my-1 px-2 text-sm font-semibold text-muted-foreground">行操作</div>
          {TABLE_ACTIONS.slice(0, 3).map((action) => (
            <EditorBubbleItem
              key={action.name}
              onSelect={() => {
                // 检查是否可以执行命令
                if (!action.disabled?.(editor)) {
                  action.command(editor);
                  onOpenChange(false);
                }
              }}
              className={`flex cursor-pointer items-center gap-2 px-2 py-1 text-sm hover:bg-accent ${
                action.disabled?.(editor) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <action.icon className="h-4 w-4" />
              <span>{action.name}</span>
            </EditorBubbleItem>
          ))}
        </div>

        <div className="border-t my-1"></div>

        <div className="flex flex-col">
          <div className="my-1 px-2 text-sm font-semibold text-muted-foreground">列操作</div>
          {TABLE_ACTIONS.slice(3, 6).map((action) => (
            <EditorBubbleItem
              key={action.name}
              onSelect={() => {
                // 检查是否可以执行命令
                if (!action.disabled?.(editor)) {
                  action.command(editor);
                  onOpenChange(false);
                }
              }}
              className={`flex cursor-pointer items-center gap-2 px-2 py-1 text-sm hover:bg-accent ${
                action.disabled?.(editor) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <action.icon className="h-4 w-4" />
              <span>{action.name}</span>
            </EditorBubbleItem>
          ))}
        </div>

        <div className="border-t my-1"></div>

        <div className="flex flex-col">
          <div className="my-1 px-2 text-sm font-semibold text-muted-foreground">单元格操作</div>
          {TABLE_ACTIONS.slice(6, 8).map((action) => (
            <EditorBubbleItem
              key={action.name}
              onSelect={() => {
                // 检查是否可以执行命令
                if (!action.disabled?.(editor)) {
                  action.command(editor);
                  onOpenChange(false);
                }
              }}
              className={`flex cursor-pointer items-center gap-2 px-2 py-1 text-sm hover:bg-accent ${
                action.disabled?.(editor) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <action.icon className="h-4 w-4" />
              <span>{action.name}</span>
            </EditorBubbleItem>
          ))}
        </div>

        <div className="border-t my-1"></div>

        <div className="flex flex-col">
          <div className="my-1 px-2 text-sm font-semibold text-muted-foreground text-red-500">
            删除操作
          </div>
          {TABLE_ACTIONS.slice(8, 9).map((action) => (
            <EditorBubbleItem
              key={action.name}
              onSelect={() => {
                // 检查是否可以执行命令
                if (!action.disabled?.(editor)) {
                  action.command(editor);
                  onOpenChange(false);
                }
              }}
              className={`flex cursor-pointer items-center gap-2 px-2 py-1 text-sm hover:bg-red-50 text-red-600 ${
                action.disabled?.(editor) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <action.icon className="h-4 w-4" />
              <span>{action.name}</span>
            </EditorBubbleItem>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
