export interface OutlineItem {
  id: string;
  level: number; // 1-6 对应 h1-h6
  text: string;
  children: OutlineItem[];
}

/**
 * 从HTML内容中提取标题并构建大纲树结构
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
    
    // 生成唯一ID，如果没有现有ID的话
    let id = element.id;
    if (!id) {
      id = `heading-${level}-${index}`;
      element.id = id; // 为元素添加ID，便于后续跳转
    }

    const item: OutlineItem = {
      id,
      level,
      text,
      children: []
    };

    headings.push(item);
  });

  // 构建层级树结构
  return buildHeadingTree(headings);
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
    behavior: 'smooth'
  });
}





