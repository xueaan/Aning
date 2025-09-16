import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { invokeTauri } from '@/utils/tauriWrapper';
import type {
  Book,
  BookCreate,
  BookUpdate,
  ReadingNote,
  ReadingNoteCreate,
  BookHighlight,
  BookHighlightCreate,
  BookStatus,
  BookFilters,
  BookViewMode,
} from '@/types/book';

interface BookStore {
  // 状态
  books: Book[];
  currentBook: Book | null;
  readingNotes: ReadingNote[];
  bookHighlights: BookHighlight[];
  selectedNote: ReadingNote | null;
  selectedHighlight: BookHighlight | null;

  // 筛选和视图
  filters: BookFilters;
  viewMode: BookViewMode;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // 书籍操作
  loadBooks: (status?: BookStatus) => Promise<void>;
  getBookById: (bookId: string) => Promise<Book | null>;
  createBook: (book: BookCreate) => Promise<Book>;
  updateBook: (id: string, updates: BookUpdate) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  searchBooks: (query: string) => Promise<void>;
  setCurrentBook: (book: Book | null) => void;
  fetchDoubanBook: (url: string) => Promise<any>;

  // 读书笔记操作
  loadReadingNotes: (bookId: string) => Promise<void>;
  createReadingNote: (note: ReadingNoteCreate) => Promise<ReadingNote>;
  deleteReadingNote: (id: string) => Promise<void>;
  setSelectedNote: (note: ReadingNote | null) => void;

  // 高亮句子操作
  loadBookHighlights: (bookId: string) => Promise<void>;
  createBookHighlight: (highlight: BookHighlightCreate) => Promise<BookHighlight>;
  deleteBookHighlight: (id: string) => Promise<void>;
  setSelectedHighlight: (highlight: BookHighlight | null) => void;

  // 筛选和视图设置
  setFilters: (filters: BookFilters) => void;
  setViewMode: (mode: BookViewMode) => void;
  setSearchQuery: (query: string) => void;

  // 工具方法
  clearError: () => void;
  updateReadingProgress: (bookId: string, currentPage: number) => Promise<void>;
  markAsFinished: (bookId: string) => Promise<void>;
  startReading: (bookId: string) => Promise<void>;
}

export const useBookStore = create<BookStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      books: [],
      currentBook: null,
      readingNotes: [],
      bookHighlights: [],
      selectedNote: null,
      selectedHighlight: null,
      filters: { status: 'all', sort: 'recent' },
      viewMode: 'grid',
      searchQuery: '',
      isLoading: false,
      error: null,

      // 书籍操作
      loadBooks: async (status?: BookStatus) => {
        try {
          set({ isLoading: true, error: null });
          const books = await invokeTauri<Book[]>('get_books', { status });
          set({ books, isLoading: false });
        } catch (error) {
          console.error('Failed to load books:', error);
          set({
            error: error instanceof Error ? error.message : '加载书籍失败',
            isLoading: false,
          });
        }
      },

      getBookById: async (bookId: string): Promise<Book | null> => {
        try {
          set({ error: null });
          const book = await invokeTauri<Book | null>('get_book_by_id', { bookId });
          return book;
        } catch (error) {
          console.error('Failed to get book:', error);
          set({
            error: error instanceof Error ? error.message : '获取书籍失败',
          });
          return null;
        }
      },

      createBook: async (book: BookCreate) => {
        try {
          set({ isLoading: true, error: null });

          // 处理tags - 如果是数组，转换为逗号分隔的字符串
          const bookData = {
            ...book,
            tags: book.tags ? book.tags.join(',') : undefined,
          };

          const newBook = await invokeTauri<Book>('create_book', { book: bookData });

          // 处理返回的tags - 如果是字符串，转换为数组
          if (newBook.tags && typeof newBook.tags === 'string') {
            newBook.tags = (newBook.tags as any).split(',').filter(Boolean);
          }

          set((state) => ({
            books: [...state.books, newBook],
            isLoading: false,
          }));

          return newBook;
        } catch (error) {
          console.error('Failed to create book:', error);
          set({
            error: error instanceof Error ? error.message : '创建书籍失败',
            isLoading: false,
          });
          throw error;
        }
      },

      updateBook: async (id: string, updates: BookUpdate) => {
        try {
          set({ error: null });

          // 处理tags
          const updateData = {
            ...updates,
            tags: updates.tags ? updates.tags.join(',') : undefined,
          };

          await invokeTauri('update_book', { id, updates: updateData });

          set((state) => ({
            books: state.books.map((book) =>
              book.id === id
                ? {
                    ...book,
                    ...updates,
                    updated_at: Date.now(),
                  }
                : book
            ),
            currentBook:
              state.currentBook?.id === id
                ? { ...state.currentBook, ...updates, updated_at: Date.now() }
                : state.currentBook,
          }));
        } catch (error) {
          console.error('Failed to update book:', error);
          set({ error: error instanceof Error ? error.message : '更新书籍失败' });
          throw error;
        }
      },

      deleteBook: async (id: string) => {
        try {
          set({ error: null });
          await invokeTauri('delete_book', { id });

          set((state) => ({
            books: state.books.filter((book) => book.id !== id),
            currentBook: state.currentBook?.id === id ? null : state.currentBook,
          }));
        } catch (error) {
          console.error('Failed to delete book:', error);
          set({ error: error instanceof Error ? error.message : '删除书籍失败' });
          throw error;
        }
      },

      searchBooks: async (query: string) => {
        try {
          set({ searchQuery: query, isLoading: true, error: null });

          if (query.trim()) {
            const results = await invokeTauri<Book[]>('search_books', { query });

            // 处理返回的tags
            results.forEach((book) => {
              if (book.tags && typeof book.tags === 'string') {
                book.tags = (book.tags as any).split(',').filter(Boolean);
              }
            });

            set({ books: results, isLoading: false });
          } else {
            await get().loadBooks();
          }
        } catch (error) {
          console.error('Failed to search books:', error);
          set({
            error: error instanceof Error ? error.message : '搜索失败',
            isLoading: false,
          });
        }
      },

      setCurrentBook: (book: Book | null) => {
        set({ currentBook: book });
      },

      // 读书笔记操作
      loadReadingNotes: async (bookId: string) => {
        try {
          set({ isLoading: true, error: null });
          const notes = await invokeTauri<ReadingNote[]>('get_reading_notes', { bookId });
          set({ readingNotes: notes, isLoading: false });
        } catch (error) {
          console.error('Failed to load reading notes:', error);
          set({
            error: error instanceof Error ? error.message : '加载笔记失败',
            isLoading: false,
          });
        }
      },

      createReadingNote: async (note: ReadingNoteCreate) => {
        try {
          set({ error: null });
          const newNote = await invokeTauri<ReadingNote>('create_reading_note', { note });

          set((state) => ({
            readingNotes: [newNote, ...state.readingNotes],
          }));

          return newNote;
        } catch (error) {
          console.error('Failed to create reading note:', error);
          set({ error: error instanceof Error ? error.message : '创建笔记失败' });
          throw error;
        }
      },

      deleteReadingNote: async (id: string) => {
        try {
          set({ error: null });
          await invokeTauri('delete_reading_note', { id });

          set((state) => ({
            readingNotes: state.readingNotes.filter((note) => note.id !== id),
            selectedNote: state.selectedNote?.id === id ? null : state.selectedNote,
          }));
        } catch (error) {
          console.error('Failed to delete reading note:', error);
          set({ error: error instanceof Error ? error.message : '删除笔记失败' });
          throw error;
        }
      },

      setSelectedNote: (note: ReadingNote | null) => {
        set({ selectedNote: note });
      },

      // 高亮句子操作
      loadBookHighlights: async (bookId: string) => {
        try {
          set({ isLoading: true, error: null });
          const highlights = await invokeTauri<BookHighlight[]>('get_book_highlights', { bookId });
          set({ bookHighlights: highlights, isLoading: false });
        } catch (error) {
          console.error('Failed to load book highlights:', error);
          set({
            error: error instanceof Error ? error.message : '加载高亮失败',
            isLoading: false,
          });
        }
      },

      createBookHighlight: async (highlight: BookHighlightCreate) => {
        try {
          set({ error: null });
          const newHighlight = await invokeTauri<BookHighlight>('create_book_highlight', { highlight });

          set((state) => ({
            bookHighlights: [newHighlight, ...state.bookHighlights],
          }));

          return newHighlight;
        } catch (error) {
          console.error('Failed to create book highlight:', error);
          set({ error: error instanceof Error ? error.message : '创建高亮失败' });
          throw error;
        }
      },

      deleteBookHighlight: async (id: string) => {
        try {
          set({ error: null });
          await invokeTauri('delete_book_highlight', { id });

          set((state) => ({
            bookHighlights: state.bookHighlights.filter((highlight) => highlight.id !== id),
            selectedHighlight: state.selectedHighlight?.id === id ? null : state.selectedHighlight,
          }));
        } catch (error) {
          console.error('Failed to delete book highlight:', error);
          set({ error: error instanceof Error ? error.message : '删除高亮失败' });
          throw error;
        }
      },

      setSelectedHighlight: (highlight: BookHighlight | null) => {
        set({ selectedHighlight: highlight });
      },

      // 筛选和视图设置
      setFilters: (filters: BookFilters) => {
        set({ filters });
      },

      setViewMode: (mode: BookViewMode) => {
        set({ viewMode: mode });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      // 工具方法
      clearError: () => {
        set({ error: null });
      },

      updateReadingProgress: async (bookId: string, currentPage: number) => {
        try {
          await get().updateBook(bookId, { current_page: currentPage });
        } catch (error) {
          console.error('Failed to update reading progress:', error);
          throw error;
        }
      },

      markAsFinished: async (bookId: string) => {
        try {
          const now = Date.now();
          await get().updateBook(bookId, {
            status: 'finished',
            finish_date: now,
          });
        } catch (error) {
          console.error('Failed to mark as finished:', error);
          throw error;
        }
      },

      startReading: async (bookId: string) => {
        try {
          const now = Date.now();
          await get().updateBook(bookId, {
            status: 'reading',
            start_date: now,
          });
        } catch (error) {
          console.error('Failed to start reading:', error);
          throw error;
        }
      },

      // 从豆瓣获取书籍信息
      fetchDoubanBook: async (url: string) => {
        try {
          set({ isLoading: true, error: null });
          const bookInfo = await invokeTauri('fetch_douban_book', { url });
          set({ isLoading: false });
          return bookInfo;
        } catch (error) {
          console.error('Failed to fetch Douban book:', error);
          set({
            error: error instanceof Error ? error.message : '获取豆瓣图书信息失败',
            isLoading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: 'book-store',
    }
  )
);
