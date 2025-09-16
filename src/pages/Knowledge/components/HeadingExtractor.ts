export interface OutlineItem {
  id: string;
  level: number; // 1-6 对应 h1-h6
  text: string;
  children: OutlineItem[];
}

/**
 * 生成基于文本内容的稳定ID
 * @param text 标题文本
 * @param level 标题级别
 * @param index 索引
 * @returns 稳定的ID
 */
function generateStableHeadingId(text: string, level: number, index: number): string {
  // 清理文本，移除特殊字符，转换为kebab-case
  const cleanText = text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, '') // 保留中文字符
    .replace(/\s+/g, '-')
    .substring(0, 50); // 限制长度

  if (cleanText) {
    return `heading-${level}-${cleanText}-${index}`;
  } else {
    return `heading-${level}-${index}`;
  }
}

/**
 * 从HTML内容中提取标题并构建大纲树结构，并为实际DOM中的标题添加ID
 * @param htmlContent 编辑器的HTML内容
 * @returns 大纲树结构
 */
export function extractHeadings(htmlContent: string): OutlineItem[] {
  if (!htmlContent || htmlContent.trim() === '') {
    return [];
  }

  // 创建临时DOM元素来解析HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // 查找所有标题元素
  const headingElements = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');

  if (headingElements.length === 0) {
    return [];
  }

  const headings: OutlineItem[] = [];

  headingElements.forEach((element, index) => {
    const tagName = element.tagName.toLowerCase();
    const level = parseInt(tagName.charAt(1)); // h1 -> 1, h2 -> 2, etc.
    const text = element.textContent?.trim() || '';

    // 生成稳定的ID
    let id = element.id;
    if (!id) {
      id = generateStableHeadingId(text, level, index);
    }

    const item: OutlineItem = {
      id,
      level,
      text,
      children: [],
    };

    headings.push(item);
  });

  // 同步ID到实际编辑器DOM
  syncHeadingIdsToEditor(headings);

  // 构建层级树结构
  return buildHeadingTree(headings);
}

/**
 * 同步标题ID到编辑器DOM
 * @param headings 标题数据
 */
function syncHeadingIdsToEditor(headings: OutlineItem[]): void {
  // 查找编辑器容器
  const editorElement = document.querySelector('.knowledge-editor .ProseMirror') as HTMLElement;
  if (!editorElement) return;

  // 获取编辑器中的所有标题元素
  const editorHeadings = editorElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const flatHeadings = flattenOutlineItems(headings);

  // 为每个DOM标题元素设置对应的ID
  editorHeadings.forEach((element, index) => {
    const text = element.textContent?.trim() || '';
    const level = parseInt(element.tagName.charAt(1));

    // 查找匹配的标题数据
    const matchingHeading = flatHeadings.find(
      (h, i) => h.text === text && h.level === level && i === index
    );

    if (matchingHeading && !element.id) {
      element.id = matchingHeading.id;
    }
  });
}

/**
 * 将扁平的标题列表构建为层级树结构
 * @param headings 扁平的标题列表
 * @returns 层级树结构
 */
function buildHeadingTree(headings: OutlineItem[]): OutlineItem[] {
  if (headings.length === 0) return [];

  const root: OutlineItem[] = [];
  const stack: OutlineItem[] = [];

  for (const heading of headings) {
    // 找到合适的父级
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // 顶级标题
      root.push(heading);
    } else {
      // 子标题
      const parent = stack[stack.length - 1];
      parent.children.push(heading);
    }

    stack.push(heading);
  }

  return root;
}

/**
 * 扁平化大纲树，用于搜索和导航
 * @param items 大纲树
 * @returns 扁平化的大纲项列表
 */
export function flattenOutlineItems(items: OutlineItem[]): OutlineItem[] {
  const result: OutlineItem[] = [];

  function traverse(items: OutlineItem[]) {
    for (const item of items) {
      result.push(item);
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    }
  }

  traverse(items);
  return result;
}

/**
 * 根据当前滚动位置确定活跃的标题ID
 * @param headingIds 所有标题ID列表
 * @param threshold 滚动阈值（像素）
 * @returns 当前活跃的标题ID
 */
export function getActiveHeadingId(headingIds: string[], threshold: number = 100): string | null {
  if (headingIds.length === 0) return null;

  let activeId: string | null = null;
  let minDistance = Infinity;

  for (const id of headingIds) {
    const element = document.getElementById(id);
    if (!element) continue;

    const rect = element.getBoundingClientRect();
    const distance = Math.abs(rect.top - threshold);

    if (rect.top <= threshold && distance < minDistance) {
      minDistance = distance;
      activeId = id;
    }
  }

  // 如果没有找到在阈值内的标题，返回第一个可见的标题
  if (!activeId) {
    for (const id of headingIds) {
      const element = document.getElementById(id);
      if (element && element.getBoundingClientRect().top >= 0) {
        activeId = id;
        break;
      }
    }
  }

  return activeId;
}

/**
 * 平滑滚动到指定标题
 * @param headingId 标题ID
 * @param offset 滚动偏移量（像素）
 */
export function scrollToHeading(headingId: string, offset: number = 80): void {
  const element = document.getElementById(headingId);
  if (!element) return;

  const elementPosition = element.offsetTop;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  });
}
