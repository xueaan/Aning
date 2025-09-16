import { Node, Edge } from 'reactflow';

export interface Board {
  id: string;
  title: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  thumbnail?: string;
}

export type ViewMode = 'list' | 'canvas';
export type DisplayMode = 'card' | 'list';
export type FilterMode = 'all' | 'favorite';
