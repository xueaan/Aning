import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Board, ViewMode, DisplayMode, FilterMode } from '@/types/mindBoard';
import { useAppStore } from './appStore';

interface MindBoardStore {
  boards: Board[];
  currentBoard: Board | null;
  viewMode: ViewMode;
  displayMode: DisplayMode;
  filter: FilterMode;
  searchTerm: string;

  // 板子管理
  createBoard: () => Board;
  deleteBoard: (id: string) => void;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  toggleFavorite: (id: string) => void;

  // 节点管理
  deleteNode: (nodeId: string) => void;

  // 视图控制
  openBoard: (id: string) => void;
  exitCanvas: () => void;
  setViewMode: (mode: ViewMode) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setFilter: (filter: FilterMode) => void;
  setSearchTerm: (term: string) => void;

  // 获取筛选后的思维板列表
  getFilteredBoards: () => Board[];
}

export const useMindBoardStore = create<MindBoardStore>()(
  persist(
    (set, get) => ({
      boards: [],
      currentBoard: null,
      viewMode: 'list',
      displayMode: 'card',
      filter: 'all',
      searchTerm: '',

      createBoard: () => {
        const newBoard: Board = {
          id: `board-${Date.now()}`,
          title: `思维板 ${get().boards.length + 1}`,
          nodes: [],
          edges: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isFavorite: false,
        };

        set((state) => ({
          boards: [...state.boards, newBoard],
        }));

        return newBoard;
      },

      deleteBoard: (id) => {
        set((state) => ({
          boards: state.boards.filter((b) => b.id !== id),
          currentBoard: state.currentBoard?.id === id ? null : state.currentBoard,
        }));
      },

      updateBoard: (id, updates) => {
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === id ? { ...board, ...updates, updatedAt: new Date() } : board
          ),
          currentBoard:
            state.currentBoard?.id === id
              ? { ...state.currentBoard, ...updates, updatedAt: new Date() }
              : state.currentBoard,
        }));
      },

      toggleFavorite: (id) => {
        set((state) => ({
          boards: state.boards.map((board) =>
            board.id === id ? { ...board, isFavorite: !board.isFavorite } : board
          ),
        }));
      },

      deleteNode: (nodeId) => {
        const currentBoard = get().currentBoard;
        if (currentBoard) {
          const updatedNodes = currentBoard.nodes.filter((node) => node.id !== nodeId);
          const updatedEdges = currentBoard.edges.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId
          );
          get().updateBoard(currentBoard.id, {
            nodes: updatedNodes,
            edges: updatedEdges,
          });
        }
      },

      openBoard: (id) => {
        const board = get().boards.find((b) => b.id === id);
        if (board) {
          // 添加到全局导航历史
          const appStore = useAppStore.getState();
          appStore.addToHistory({
            moduleId: 'mindBoard-canvas',
            noteId: id,
            timestamp: Date.now(),
            title: board.title,
          });

          set({
            currentBoard: board,
            viewMode: 'canvas',
          });
        }
      },

      exitCanvas: () => {
        // 添加到全局导航历史（返回到思维板列表）
        const appStore = useAppStore.getState();
        appStore.addToHistory({
          moduleId: 'mindBoard',
          timestamp: Date.now(),
          title: '思维板',
        });

        set({
          viewMode: 'list',
          currentBoard: null,
        });
      },

      setViewMode: (mode) => set({ viewMode: mode }),
      setDisplayMode: (mode) => set({ displayMode: mode }),
      setFilter: (filter) => set({ filter }),
      setSearchTerm: (term) => set({ searchTerm: term }),

      getFilteredBoards: () => {
        const state = get();
        return state.boards.filter((board) => {
          const matchesSearch = board.title.toLowerCase().includes(state.searchTerm.toLowerCase());
          const matchesFilter =
            state.filter === 'all' || (state.filter === 'favorite' && board.isFavorite);
          return matchesSearch && matchesFilter;
        });
      },
    }),
    {
      name: 'mind-board-storage',
      partialize: (state) => ({
        boards: state.boards,
        displayMode: state.displayMode,
        filter: state.filter,
      }),
    }
  )
);
