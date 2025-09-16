import { ReactNodeViewRenderer } from '@tiptap/react';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { CodeBlockComponent } from './CodeBlockComponent';

// 创建 lowlight 实例并注册支持的语言
const lowlight = createLowlight(common);

// 导入额外的语言支持
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';

// 注册语言
lowlight.register({ sql, java, python, bash, javascript, typescript, go, rust });

export const EnhancedBlockExtension = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  },

  addShortcuts() {
    return {
      'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock(),

      // exit node on triple enter,
      Enter: ({ editor }: { editor: any }) => {
        if (!this.editor.isActive(this.name)) {
          return false;
        }

        const { state } = editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;
        const endsWithDoubleNewline = $from.parent.textContent.endsWith('\n\n');

        if (!isAtEnd || !endsWithDoubleNewline) {
          return false;
        }

        return editor
          .chain()
          .command(({ tr }: { tr: any }) => {
            tr.delete($from.pos - 2, $from.pos);
            return true;
          })
          .exit()
          .run();
      },

      // exit node on arrow down,
      ArrowDown: ({ editor }: { editor: any }) => {
        if (!this.editor.isActive(this.name)) {
          return false;
        }

        const { state } = editor;
        const { selection, doc } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parent.type !== this.type) {
          return false;
        }

        const isAtEnd = $from.parentOffset === $from.parent.nodeSize - 2;

        if (!isAtEnd) {
          return false;
        }

        const after = $from.after();

        if (after === undefined) {
          return false;
        }

        const nodeAfter = doc.nodeAt(after);

        if (nodeAfter) {
          return false;
        }

        return editor.commands.exit();
      },
    };
  },
}).configure({
  lowlight,
  defaultLanguage: '',
  HTMLAttributes: {
    class: 'hljs',
  },
});
