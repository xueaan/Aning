import { Node, Edge } from 'reactflow';
export interface MindMapConfig {
  centerX: number;
  centerY: number;
  topic: string;
  subtopics?: string[];
}
export const createMindMap = (config: MindMapConfig): { nodes: Node[]; edges: Edge[] } => {
  const { centerX, centerY, topic, subtopics = [] } = config;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 创建中心节点
  const centerNodeId = `mindmap-center-${Date.now()}`;
  nodes.push({
    id: centerNodeId,
    type: 'mindMapNode',
    position: { x: centerX, y: centerY },
    data: {
      label: topic,
      colorIndex: 0, // 蓝色作为中心节点
      isCenter: true
    }
  });

  // 创建子节点
  if (subtopics.length > 0) {
    const angleStep = (2 * Math.PI) / subtopics.length;
    const radius = 200; // 子节点距离中心的距离

    subtopics.forEach((subtopic, index) => {
      const angle = angleStep * index - Math.PI / 2; // 从顶部开始
      const nodeId = `mindmap-child-${Date.now()}-${index}`;
      
      // 计算子节点位置
      const nodeX = centerX + Math.cos(angle) * radius;
      const nodeY = centerY + Math.sin(angle) * radius;

      // 创建子节点
      nodes.push({
        id: nodeId,
        type: 'mindMapNode',
        position: { x: nodeX, y: nodeY },
        data: {
          label: subtopic,
          colorIndex: (index + 1) % 6, // 循环使用不同颜色
          isChild: true
        }
      });

      // 创建连接边
      edges.push({
        id: `edge-${centerNodeId}-${nodeId}`,
        source: centerNodeId,
        target: nodeId,
        type: 'mindMapEdge',
        animated: false
      });
    });
  }

  return { nodes, edges };
};

// 默认思维导图模板
export const defaultMindMapTemplates = [
  {
    name: '项目规划',
    topic: '新项目',
    subtopics: ['需求分析', '技术选型', '人员安排', '时间计划', '风险评估']
  },
  {
    name: '学习计划',
    topic: '学习主题',
    subtopics: ['基础知识', '实践练习', '深入研究', '总结输出']
  },
  {
    name: '问题分析',
    topic: '核心问题',
    subtopics: ['问题现状', '原因分析', '解决方案', '实施计划', '效果评估']
  },
  {
    name: '产品设计',
    topic: '产品概念',
    subtopics: ['用户需求', '功能设计', '交互设计', '技术实现', '测试验证']
  },
  {
    name: '会议记录',
    topic: '会议主题',
    subtopics: ['讨论要点', '决策结果', '行动项', '责任人', '截止时间']
  }
];

// 为现有节点添加子节点的工具函数
export const addChildToNode = (
  parentNodeId: string,
  parentPosition: { x: number, y: number },
  existingNodes: Node[],
  existingEdges: Edge[],
  childLabel: string = '新子节点'
): { nodes: Node[], edges: Edge[] } => {
  const childrenCount = existingEdges.filter(edge => edge.source === parentNodeId).length;
  const angle = (childrenCount * Math.PI * 2) / 8; // 每个子节点间隔45度
  const radius = 150;
  
  const childNodeId = `mindmap-child-${Date.now()}`;
  const childX = parentPosition.x + Math.cos(angle) * radius;
  const childY = parentPosition.y + Math.sin(angle) * radius;

  const newNode: Node = {
    id: childNodeId,
    type: 'mindMapNode',
    position: { x: childX, y: childY },
    data: {
      label: childLabel,
      colorIndex: Math.floor(Math.random() * 6),
      parentId: parentNodeId
    }
  };

  const newEdge: Edge = {
    id: `edge-${parentNodeId}-${childNodeId}`,
    source: parentNodeId,
    target: childNodeId,
    type: 'mindMapEdge',
    animated: false
  };

  return {
    nodes: [...existingNodes, newNode],
    edges: [...existingEdges, newEdge]
  };
};





