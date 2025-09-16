import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

export const MindMapEdge: React.FC<EdgeProps> = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 4 : 3,
          stroke: selected ? 'url(#edge-gradient-selected)' : 'url(#edge-gradient)',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          filter: selected
            ? 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4))'
            : 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.15))',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
            opacity: selected ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
          className="nodrag nopan"
        >
          {/* 可选的连线标签或删除按钮 */}
          {selected && (
            <div className="flex items-center gap-1 px-2 py-1 bg-white/90 dark:bg-black/90 rounded-md shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-600 dark:text-gray-300">连线</span>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
