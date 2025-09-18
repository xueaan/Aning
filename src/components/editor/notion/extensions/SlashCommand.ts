import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface SlashCommandOptions {
  onSlashCommand?: (pos: { top: number; left: number }) => void;
  onCloseSlashCommand?: () => void;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      onSlashCommand: undefined,
      onCloseSlashCommand: undefined,
    };
  },

  addProseMirrorPlugins() {
    const { onSlashCommand, onCloseSlashCommand } = this.options;

    return [
      new Plugin({
        key: new PluginKey('slashCommand'),
        props: {
          handleKeyDown(view, event) {
            const { state } = view;
            const { selection } = state;
            const { $from } = selection;

            // 检测斜杠命令
            if (event.key === '/') {
              const textBefore = $from.nodeBefore?.textContent || '';
              const lastChar = textBefore.slice(-1);

              // 只在块的开始或空格后触发
              if (!textBefore || lastChar === ' ' || lastChar === '\n') {
                // 计算位置
                setTimeout(() => {
                  const coords = view.coordsAtPos($from.pos);
                  onSlashCommand?.({
                    top: coords.top + 24,
                    left: coords.left,
                  });
                }, 0);
              }
            }

            // ESC 键关闭菜单
            if (event.key === 'Escape') {
              onCloseSlashCommand?.();
            }

            return false;
          },

          handleTextInput(view, from, _, text) {
            const { state } = view;
            const { doc } = state;

            // 检查是否正在输入斜杠命令
            const textBefore = doc.textBetween(Math.max(0, from - 1), from);

            if (textBefore === '/') {
              // 已经在斜杠命令模式
              return false;
            }

            // 如果输入的不是斜杠相关字符，关闭菜单
            if (text && text !== '/' && !text.match(/^[a-zA-Z0-9\u4e00-\u9fa5]$/)) {
              onCloseSlashCommand?.();
            }

            return false;
          },
        },
      }),
    ];
  },
});