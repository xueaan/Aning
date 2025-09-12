import React from 'react';
import { EdgeProps, getStraightPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

export const MindMapEdge: React.FC<EdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd
}) => {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY: sourceY + 10, // 稍微调整源点位置
    targetX,
    targetY
  });

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: '#3b82f6',
          strokeDasharray: '0'
        }}
      />
      <EdgeLabelRenderer>
        <div 
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all'
          }}
          className="nodrag nopan"
        >
        {/* 可以在这里添加边的标签或操作按钮 */}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};









