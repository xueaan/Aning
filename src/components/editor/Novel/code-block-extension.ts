import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CodeBlockComponent } from './CodeBlockComponent';

export interface BlockExtensionOptions {
  defaultLanguage?: string;
  HTMLAttributes?: Record<string, any>;
  languageClassPrefix?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    codeBlock: {
      setCodeBlock: (attributes?: { language: string }) => ReturnType;
      toggleCodeBlock: (attributes?: { language: string }) => ReturnType;
    }
  }
}

export const BlockExtension = Node.create<BlockExtensionOptions>({
  name: 'codeBlock',

  group: 'block',

  content: 'text*',

  marks: '',
  code: true,

  defining: true,

  addOptions() {
    return {
      defaultLanguage: '',
      HTMLAttributes: {},
      languageClassPrefix: 'language-'
    };
  },

  addAttributes() {
    return {
      language: {
        default: this.options.defaultLanguage,
        parseHTML: (element) => {
          const { languageClassPrefix = 'language-' } = this.options;
          const classNames = Array.from(element.firstElementChild?.classList || []);
          const languages = classNames
            .filter((className) => className.startsWith(languageClassPrefix))
            .map((className) => className.replace(languageClassPrefix, ''));
          const language = languages[0];

          if (!language) {
            return null;
          }

          return language;
        },
        rendered: false
      }
    };
  },

  parseHTML() {
    return [{
      tag: 'pre',
      preserveWhitespace: 'full'
    }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'pre',
      {
        ...this.options.HTMLAttributes,
        ...HTMLAttributes
      },
      [
        'code',
        {
          class: node.attrs.language
            ? `language-${node.attrs.language}`
            : null
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      setCodeBlock:
        (attributes?: { language?: string }) =>
        ({ commands }: { commands: any }) => {
          return commands.setNode(this.name, attributes);
        },
      toggleCodeBlock:
        (attributes?: { language?: string }) =>
        ({ commands }: { commands: any }) => {
          return commands.toggleNode(this.name, 'paragraph', attributes);
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock(),

      // remove code block when at start of document or code block is empty,
      Backspace: () => {
        const { empty, $anchor } = this.editor.state.selection;
        const isAtStart = $anchor.pos === 1;

        if (!empty || $anchor.parent.type.name !== this.name) {
          return false;
        }

        if (isAtStart || !$anchor.parent.textContent.length) {
          return this.editor.commands.clearNodes();
        }

        return false;
      },

      // exit node on triple enter,
      Enter: ({ editor }) => {
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
          .command(({ tr }) => {
            tr.delete($from.pos - 2, $from.pos);

            return true;
          })
          .selectParentNode()
          .run();
      },

      // exit node on arrow down,
      ArrowDown: ({ editor }) => {
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

        return editor.commands.selectParentNode();
      }
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockComponent);
  }
});
