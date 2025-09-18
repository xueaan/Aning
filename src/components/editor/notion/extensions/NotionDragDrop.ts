import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const NotionDragDrop = Extension.create({
  name: 'notionDragDrop',

  addProseMirrorPlugins() {
    let draggedNode: any = null;
    let draggedPos: number = -1;
    let dragHandle: HTMLElement | null = null;

    // Create drag handle element
    const createDragHandle = (editorView: any) => {
      const handle = document.createElement('div');
      handle.classList.add('notion-drag-handle');
      handle.draggable = true;
      handle.contentEditable = 'false';
      handle.style.position = 'absolute';
      handle.style.display = 'none';
      handle.style.zIndex = '1000';

      // Create drag dots (6 dots in 2x3 grid)
      const dotsContainer = document.createElement('div');
      dotsContainer.classList.add('notion-drag-dots');
      for (let i = 0; i < 6; i++) {
        const dot = document.createElement('div');
        dot.classList.add('notion-drag-dot');
        dotsContainer.appendChild(dot);
      }

      // Create + button
      const addButton = document.createElement('button');
      addButton.classList.add('notion-drag-add');
      addButton.title = '添加块';
      addButton.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      `;
      addButton.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Trigger slash command at the current position
        const blockElement = (dragHandle as any).__blockElement;
        if (blockElement) {
          // Focus on the block and insert a new paragraph with slash
          const pos = editorView.posAtDOM(blockElement, 0);
          if (pos >= 0) {
            const $pos = editorView.state.doc.resolve(pos);
            const endPos = $pos.after($pos.depth);
            editorView.dispatch(
              editorView.state.tr
                .insert(endPos, editorView.state.schema.nodes.paragraph.create())
                .setSelection(
                  editorView.state.selection.constructor.near(
                    editorView.state.doc.resolve(endPos + 1)
                  )
                )
            );
            editorView.focus();
            // Insert slash
            setTimeout(() => {
              editorView.dispatch(
                editorView.state.tr.insertText('/')
              );
            }, 50);
          }
        }
      };

      handle.appendChild(dotsContainer);
      handle.appendChild(addButton);

      return handle;
    };

    return [
      new Plugin({
        key: new PluginKey('notionDragDrop'),

        view(editorView) {
          // Create and attach drag handle
          dragHandle = createDragHandle(editorView);
          const editorElement = editorView.dom.parentElement;
          if (editorElement) {
            editorElement.style.position = 'relative';
            editorElement.appendChild(dragHandle);
          }

          // Update drag handle position on hover
          const updateDragHandle = (event: MouseEvent) => {
            if (!dragHandle || !editorElement) return;

            // Get the closest block element
            const target = event.target as HTMLElement;
            let blockElement: HTMLElement | null = null;

            // Check for various block types
            blockElement = target.closest('p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, pre, div[data-type]');

            if (blockElement && editorElement.contains(blockElement)) {
              const rect = blockElement.getBoundingClientRect();
              const editorRect = editorElement.getBoundingClientRect();
              const scrollTop = editorElement.scrollTop || 0;

              // Position handle to the left of the block
              dragHandle.style.display = 'flex';
              dragHandle.style.left = `${Math.max(10, rect.left - editorRect.left - 45)}px`;
              dragHandle.style.top = `${rect.top - editorRect.top + scrollTop + 2}px`;

              // Store reference to current block
              dragHandle.setAttribute('data-block-element', '');
              (dragHandle as any).__blockElement = blockElement;
            } else {
              dragHandle.style.display = 'none';
            }
          };

          // Hide handle when mouse leaves editor
          const hideHandle = () => {
            if (dragHandle) {
              dragHandle.style.display = 'none';
            }
          };

          // Add event listeners to the editor
          editorView.dom.addEventListener('mousemove', updateDragHandle);
          editorView.dom.addEventListener('mouseleave', hideHandle);

          // Also listen on parent element for better coverage
          if (editorElement) {
            editorElement.addEventListener('mousemove', updateDragHandle);
            editorElement.addEventListener('mouseleave', hideHandle);
          }

          return {
            destroy() {
              editorView.dom.removeEventListener('mousemove', updateDragHandle);
              editorView.dom.removeEventListener('mouseleave', hideHandle);
              if (editorElement) {
                editorElement.removeEventListener('mousemove', updateDragHandle);
                editorElement.removeEventListener('mouseleave', hideHandle);
              }
              dragHandle?.remove();
            }
          };
        },

        props: {
          decorations(state) {
            const decorations: Decoration[] = [];

            // 添加拖拽时的装饰
            if (draggedPos >= 0) {
              decorations.push(
                Decoration.node(draggedPos, draggedPos + draggedNode.nodeSize, {
                  class: 'notion-dragging',
                })
              );
            }

            return DecorationSet.create(state.doc, decorations);
          },

          handleDOMEvents: {
            dragstart(view, event) {
              const target = event.target as HTMLElement;
              const isDragHandle = target.closest('.notion-drag-handle');

              if (!isDragHandle) {
                return false;
              }

              // Get the block element from the drag handle
              const blockElement = (isDragHandle as any).__blockElement;
              if (!blockElement) {
                return false;
              }

              // Find position of this element in the editor
              const pos = view.posAtDOM(blockElement, 0);
              if (pos < 0 || pos >= view.state.doc.content.size) {
                return false;
              }

              const $pos = view.state.doc.resolve(pos);
              const node = view.state.doc.nodeAt($pos.before($pos.depth));

              if (!node) {
                return false;
              }

              draggedNode = node;
              draggedPos = $pos.before($pos.depth);

              // 设置拖拽数据
              event.dataTransfer!.effectAllowed = 'move';
              event.dataTransfer!.setData('text/html', blockElement.outerHTML);

              // 添加拖拽中的样式
              blockElement.classList.add('notion-dragging');

              return false;
            },

            dragend(view, event) {
              const target = event.target as HTMLElement;
              const blockElement = target.closest('.notion-block');

              if (blockElement) {
                blockElement.classList.remove('notion-dragging');
              }

              draggedNode = null;
              draggedPos = -1;

              view.dispatch(view.state.tr);

              return false;
            },

            dragover(view, event) {
              if (!draggedNode) {
                return false;
              }

              event.preventDefault();
              event.dataTransfer!.dropEffect = 'move';

              // 计算放置位置
              const pos = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });

              if (pos) {
                // 添加放置指示器
                const target = event.target as HTMLElement;
                const blockElement = target.closest('.notion-block');

                if (blockElement) {
                  // 判断是在块的上方还是下方
                  const rect = blockElement.getBoundingClientRect();
                  const isAbove = event.clientY < rect.top + rect.height / 2;

                  // 移除其他指示器
                  document.querySelectorAll('.notion-drop-indicator').forEach(el => {
                    el.classList.remove('notion-drop-indicator-above', 'notion-drop-indicator-below');
                  });

                  // 添加当前指示器
                  blockElement.classList.add('notion-drop-indicator');
                  blockElement.classList.add(
                    isAbove ? 'notion-drop-indicator-above' : 'notion-drop-indicator-below'
                  );
                }
              }

              return false;
            },

            drop(view, event) {
              if (!draggedNode || draggedPos < 0) {
                return false;
              }

              event.preventDefault();

              // 移除所有指示器
              document.querySelectorAll('.notion-drop-indicator').forEach(el => {
                el.classList.remove(
                  'notion-drop-indicator',
                  'notion-drop-indicator-above',
                  'notion-drop-indicator-below'
                );
              });

              // 计算目标位置
              const pos = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });

              if (!pos) {
                return false;
              }

              const { state, dispatch } = view;
              const $pos = state.doc.resolve(pos.pos);

              // 找到目标块
              let targetPos = $pos.before($pos.depth);
              const targetNode = state.doc.nodeAt(targetPos);

              if (!targetNode) {
                return false;
              }

              // 判断是在块的上方还是下方
              const target = event.target as HTMLElement;
              const blockElement = target.closest('.notion-block');

              if (blockElement) {
                const rect = blockElement.getBoundingClientRect();
                const isAbove = event.clientY < rect.top + rect.height / 2;

                if (!isAbove) {
                  targetPos += targetNode.nodeSize;
                }
              }

              // 执行移动
              const tr = state.tr;

              // 删除原节点
              tr.delete(draggedPos, draggedPos + draggedNode.nodeSize);

              // 调整目标位置
              if (targetPos > draggedPos) {
                targetPos -= draggedNode.nodeSize;
              }

              // 插入节点到新位置
              tr.insert(targetPos, draggedNode);

              dispatch(tr);

              draggedNode = null;
              draggedPos = -1;

              return true;
            },

            dragleave(_, event) {
              // 移除放置指示器
              const target = event.target as HTMLElement;
              const blockElement = target.closest('.notion-block');

              if (blockElement) {
                blockElement.classList.remove(
                  'notion-drop-indicator',
                  'notion-drop-indicator-above',
                  'notion-drop-indicator-below'
                );
              }

              return false;
            },
          },
        },
      }),
    ];
  },
});