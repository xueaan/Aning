import { toPng } from 'html-to-image';
import { Board } from '@/types/mindBoard';

// 导出为 PNG 图片
export const exportToPNG = async (element: HTMLElement, fileName: string = 'mindboard.png') => {
  try {
    // 首次尝试：跳过外部字体
    const dataUrl = await toPng(element, {
      backgroundColor: '#ffffff',
      quality: 0.95,
      pixelRatio: 2,
      skipFonts: true, // 跳过字体嵌入，避免 CORS 问题
      filter: (node) => {
        // 过滤掉可能引起 CORS 问题的外部资源
        if (node.nodeName === 'LINK' && node instanceof HTMLLinkElement) {
          // 过滤掉 Google Fonts 等外部字体链接
          if (
            node.href.includes('fonts.googleapis.com') ||
            node.href.includes('fonts.gstatic.com')
          ) {
            return false;
          }
        }
        // 过滤掉外部样式表
        if (node.nodeName === 'STYLE' && node.textContent) {
          if (
            node.textContent.includes('@import') &&
            node.textContent.includes('fonts.googleapis.com')
          ) {
            return false;
          }
        }
        return true;
      },
    });

    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('导出PNG失败，尝试降级处理:', error);

    // 降级处理：使用最简单的配置
    try {
      const dataUrl = await toPng(element, {
        backgroundColor: '#ffffff',
        cacheBust: true, // 强制刷新缓存
        skipFonts: true, // 确保跳过字体
      });

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (fallbackError) {
      console.error('降级导出也失败:', fallbackError);
      throw new Error('导出失败，请检查网络连接或尝试其他格式');
    }
  }
};

// 导出为 JSON
export const exportToJSON = (board: Board, fileName: string = 'mindboard.json') => {
  try {
    const dataStr = JSON.stringify(board, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
  } catch (error) {
    console.error('导出JSON失败:', error);
    throw error;
  }
};

// 导入 JSON
export const importFromJSON = (file: File): Promise<Board> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const board = JSON.parse(result) as Board;

          // 验证数据结构
          if (
            !board.id ||
            !board.title ||
            !Array.isArray(board.nodes) ||
            !Array.isArray(board.edges)
          ) {
            throw new Error('无效的思维板数据格式');
          }

          // 生成新的ID避免冲突
          board.id = `imported-${Date.now()}`;
          board.title = `${board.title} (导入)`;
          board.createdAt = new Date();
          board.updatedAt = new Date();

          resolve(board);
        }
      } catch (error) {
        reject(new Error('解析JSON文件失败'));
      }
    };

    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };

    reader.readAsText(file);
  });
};

// 复制节点到剪贴板
export const copyNodesToClipboard = async (nodes: any[]) => {
  try {
    const data = JSON.stringify(nodes);
    await navigator.clipboard.writeText(data);
    return true;
  } catch (error) {
    console.error('复制失败:', error);
    return false;
  }
};

// 从剪贴板粘贴节点
export const pasteNodesFromClipboard = async (): Promise<any[] | null> => {
  try {
    const text = await navigator.clipboard.readText();
    const nodes = JSON.parse(text);

    if (!Array.isArray(nodes)) {
      return null;
    }

    // 生成新的节点ID并调整位置
    return nodes.map((node) => ({
      ...node,
      id: `${node.type}-${Date.now()}-${Math.random()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50,
      },
    }));
  } catch (error) {
    console.error('粘贴失败:', error);
    return null;
  }
};
