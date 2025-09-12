import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { DOMParser } from '@tiptap/pm/model';
import { isMarkdown, parseMarkdownToHTML } from './markdown-paste';

export const MarkdownPasteExtension = Extension.create({
  name: 'markdownPaste',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('markdownPaste'),
        props: {
          handlePaste: (view, event) => {
            console.log('🎯 MarkdownPasteExtension 被触发');
            
            const text = event.clipboardData?.getData('text/plain');
            console.log('🔍 粘贴的文本:', text);
            
            if (!text) {
              console.log('❌ 没有文本内容');
              return false;
            }

            const isMarkdownContent = isMarkdown(text);
            console.log('📝 是否为 Markdown:', isMarkdownContent);
            
            if (!isMarkdownContent) {
              console.log('❌ 不是 Markdown，使用默认处理');
              return false;
            }

            try {
              // 阻止默认粘贴
              event.preventDefault();
              
              // 解析 Markdown
              const html = parseMarkdownToHTML(text);
              console.log('🔄 转换后的 HTML:', html);
              
              // 创建临时 DOM 元素
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              
              // 使用 ProseMirror 的 DOMParser 解析为文档片段
              const schema = view.state.schema;
              const parser = DOMParser.fromSchema(schema);
              const doc = parser.parse(tempDiv);
              
              console.log('📄 解析后的文档:', doc);
              
              // 插入到编辑器
              const { tr } = view.state;
              // const { from, to } = view.state.selection;
              
              // 将文档内容作为片段插入
              const slice = doc.slice(0, doc.content.size);
              const newTr = tr.replaceSelection(slice);
              
              view.dispatch(newTr);
              console.log('✅ Markdown 粘贴成功');
              
              return true;
            } catch (error) {
              console.error('❌ Markdown 粘贴处理失败:', error);
              console.error('错误详情:', error);
              // 如果处理失败，允许默认粘贴
              return false;
            }
          }
        }
      }),
    ];
  }
});




