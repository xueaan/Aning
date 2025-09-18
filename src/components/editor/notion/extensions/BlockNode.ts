import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const BlockNode = Extension.create({
  name: 'blockNode',

  addOptions() {
    return {
      blockClass: 'notion-block-wrapper',
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: [
          'heading',
          'paragraph',
          'bulletList',
          'orderedList',
          'taskList',
          'blockquote',
          'codeBlock',
          'table',
          'image',
          'horizontalRule',
        ],
        attributes: {
          class: {
            renderHTML: () => {
              return {
                class: 'notion-block-content',
              };
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {

    return [
      new Plugin({
        key: new PluginKey('blockNode'),
        props: {
          decorations(state) {
            const { doc } = state;
            const decorations: any[] = [];

            doc.descendants((node, pos) => {
              if (node.isBlock && node.attrs.blockId) {
                // 为每个块添加装饰
                const decoration = {
                  pos,
                  node,
                  blockId: node.attrs.blockId,
                };
                decorations.push(decoration);
              }
            });

            return null; // 实际装饰通过 CSS 实现
          },

          handleDOMEvents: {
            // 处理块的悬停事件
            mouseover(_, event) {
              const target = event.target as HTMLElement;
              const blockElement = target.closest('.notion-block');

              if (blockElement) {
                blockElement.classList.add('notion-block-hover');
              }

              return false;
            },

            mouseout(_, event) {
              const target = event.target as HTMLElement;
              const blockElement = target.closest('.notion-block');

              if (blockElement) {
                blockElement.classList.remove('notion-block-hover');
              }

              return false;
            },

            // 处理块的点击事件
            click(_, event) {
              const target = event.target as HTMLElement;

              // 检查是否点击了拖拽手柄
              if (target.closest('.notion-drag-handle')) {
                event.preventDefault();
                // TODO: 处理拖拽逻辑
                return true;
              }

              // 检查是否点击了添加按钮
              if (target.closest('.notion-drag-add')) {
                event.preventDefault();
                // TODO: 显示添加菜单
                return true;
              }

              return false;
            },
          },
        },
      }),
    ];
  },
});