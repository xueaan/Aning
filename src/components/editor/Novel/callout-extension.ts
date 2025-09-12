import { Node, mergeAttributes } from '@tiptap/core';

export interface CalloutOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      /**
       * Insert a callout
       */
      insertCallout: (attributes?: { type: string }) => ReturnType;
    };
  }
}

export const CalloutExtension = Node.create<CalloutOptions>({
  name: 'callout',

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  group: 'block',

  content: 'block+',

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-type') || 'info',
        renderHTML: (attributes) => ({
          'data-type': attributes.type
        })
      },
      collapsed: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-collapsed') === 'true',
        renderHTML: (attributes) => ({
          'data-collapsed': attributes.collapsed
        })
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]'
      }
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const type = node.attrs.type || 'info';
    const collapsed = node.attrs.collapsed || false;
    
    // 图标通过CSS伪元素显示，不再需要定义

    return [
      'div',
      mergeAttributes(HTMLAttributes, this.options.HTMLAttributes, {
        'data-callout': true,
        'data-type': type,
        'data-collapsed': collapsed,
        class: `callout callout-${type} ${collapsed ? 'collapsed' : ''}`
      }),
      [
        'div',
        { 
          class: 'callout-header'},
        [
          'div',
          { class: 'callout-icon-container' },
          [
            'span',
            { 
              class: 'callout-icon',
              'data-type': type,
              contentEditable: false
            },
          ],
        ],
        [
          'span',
          { 
            class: 'callout-title',
            'data-type': type,
            contentEditable: false
          },
        ],
        [
          'span',
          { 
            class: `callout-toggle callout-chevron ${collapsed ? 'collapsed' : ''}`,
            contentEditable: false
          },
        ],
      ],
      [
        'div',
        { 
          class: 'callout-content'
        },
        0,
      ],
    ];
  },

  addCommands() {
    return {
      insertCallout:
        (attributes = { type: 'info' }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: '在此输入内容...' }]
              }
            ]
          });
        }
    };
  }
});


