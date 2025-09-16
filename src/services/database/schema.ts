// 数据库表结构定义
export const schemas = {
  // 笔记表
  notes: `
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      module TEXT NOT NULL CHECK(module IN ('timeline', 'notestream', 'cardbox', 'mindboard', 'writedesk')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME DEFAULT NULL
    )
  `,

  // 标签表
  tags: `
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // 笔记标签关联表
  note_tags: `
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `,

  // 时光记条目表
  timeline_entries: `
    CREATE TABLE IF NOT EXISTS timeline_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      content TEXT NOT NULL,
      weather TEXT,
      mood TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, time)
    )
  `,

  // 笔记链接关系表
  note_links: `
    CREATE TABLE IF NOT EXISTS note_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_note_id INTEGER NOT NULL,
      target_note_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (target_note_id) REFERENCES notes(id) ON DELETE CASCADE,
      UNIQUE(source_note_id, target_note_id)
    )
  `,

  // 全文搜索虚拟表
  notes_fts: `
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
      title,
      content: content =notes: content_rowid =id: tokenize ='unicode61'
    )
  `,

  // 卡片盒表
  card_boxes: `
    CREATE TABLE IF NOT EXISTS card_boxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT,
      icon TEXT,
      cards_count INTEGER DEFAULT 0,
      sort_order REAL,
      created_at INTEGER,
      updated_at INTEGER
    )
  `,

  // 卡片表
  cards: `
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      box_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      preview TEXT,
      color TEXT,
      tags TEXT,
      is_pinned BOOLEAN DEFAULT 0,
      is_archived BOOLEAN DEFAULT 0,
      sort_order REAL,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (box_id) REFERENCES card_boxes(id) ON DELETE CASCADE
    )
  `,

  // 卡片链接表
  card_links: `
    CREATE TABLE IF NOT EXISTS card_links (
      id TEXT PRIMARY KEY,
      source_card_id TEXT NOT NULL,
      target_card_id TEXT NOT NULL,
      link_type TEXT DEFAULT 'related',
      created_at INTEGER,
      UNIQUE(source_card_id, target_card_id),
      FOREIGN KEY (source_card_id) REFERENCES cards(id) ON DELETE CASCADE,
      FOREIGN KEY (target_card_id) REFERENCES cards(id) ON DELETE CASCADE
    )
  `,

  // 卡片全文搜索虚拟表
  cards_fts: `
    CREATE VIRTUAL TABLE IF NOT EXISTS cards_fts USING fts5(
      title,
      content,
      preview: content =cards: content_rowid =id: tokenize ='unicode61'
    )
  `,

  // 书籍表
  books: `
    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      author TEXT,
      isbn TEXT,
      cover TEXT,
      status TEXT DEFAULT 'wanted' CHECK(status IN ('wanted', 'reading', 'finished')),
      total_pages INTEGER,
      current_page INTEGER DEFAULT 0,
      rating INTEGER CHECK(rating >= 0 AND rating <= 5),
      tags TEXT,
      description TEXT,
      start_date INTEGER,
      finish_date INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    )
  `,

  // 读书笔记表
  reading_notes: `
    CREATE TABLE IF NOT EXISTS reading_notes (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      chapter TEXT,
      page_number INTEGER,
      content TEXT NOT NULL,
      note_type TEXT DEFAULT 'note' CHECK(note_type IN ('note', 'thought', 'summary')),
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `,

  // 书籍高亮表
  book_highlights: `
    CREATE TABLE IF NOT EXISTS book_highlights (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      note_id TEXT,
      text TEXT NOT NULL,
      page_number INTEGER,
      color TEXT DEFAULT 'yellow',
      notes TEXT,
      created_at INTEGER,
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (note_id) REFERENCES reading_notes(id) ON DELETE SET NULL
    )
  `,

  // 书籍全文搜索虚拟表
  books_fts: `
    CREATE VIRTUAL TABLE IF NOT EXISTS books_fts USING fts5(
      title,
      author,
      description: content =books: content_rowid =id: tokenize ='unicode61'
    )
  `,

  // 读书笔记全文搜索虚拟表
  reading_notes_fts: `
    CREATE VIRTUAL TABLE IF NOT EXISTS reading_notes_fts USING fts5(
      content,
      chapter: content =reading_notes: content_rowid =id: tokenize ='unicode61'
    )
  `,
};

// 索引定义
export const indexes = {
  // 笔记索引
  idx_notes_module: `CREATE INDEX IF NOT EXISTS idx_notes_module ON notes(module)`,
  idx_notes_created: `CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC)`,
  idx_notes_updated: `CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC)`,
  idx_notes_deleted: `CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(deleted_at)`,

  // 时光记索引
  idx_timeline_date: `CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_entries(date DESC)`,
  idx_timeline_datetime: `CREATE INDEX IF NOT EXISTS idx_timeline_datetime ON timeline_entries(date DESC, time DESC)`,

  // 标签索引
  idx_tags_name: `CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name)`,

  // 链接索引
  idx_links_source: `CREATE INDEX IF NOT EXISTS idx_links_source ON note_links(source_note_id)`,
  idx_links_target: `CREATE INDEX IF NOT EXISTS idx_links_target ON note_links(target_note_id)`,

  // 卡片盒索引
  idx_card_boxes_created: `CREATE INDEX IF NOT EXISTS idx_card_boxes_created ON card_boxes(created_at DESC)`,
  idx_card_boxes_sort: `CREATE INDEX IF NOT EXISTS idx_card_boxes_sort ON card_boxes(sort_order)`,

  // 卡片索引
  idx_cards_box: `CREATE INDEX IF NOT EXISTS idx_cards_box ON cards(box_id)`,
  idx_cards_created: `CREATE INDEX IF NOT EXISTS idx_cards_created ON cards(created_at DESC)`,
  idx_cards_updated: `CREATE INDEX IF NOT EXISTS idx_cards_updated ON cards(updated_at DESC)`,
  idx_cards_pinned: `CREATE INDEX IF NOT EXISTS idx_cards_pinned ON cards(is_pinned, sort_order)`,
  idx_cards_archived: `CREATE INDEX IF NOT EXISTS idx_cards_archived ON cards(is_archived)`,

  // 卡片链接索引
  idx_card_links_source: `CREATE INDEX IF NOT EXISTS idx_card_links_source ON card_links(source_card_id)`,
  idx_card_links_target: `CREATE INDEX IF NOT EXISTS idx_card_links_target ON card_links(target_card_id)`,

  // 书籍索引
  idx_books_status: `CREATE INDEX IF NOT EXISTS idx_books_status ON books(status)`,
  idx_books_created: `CREATE INDEX IF NOT EXISTS idx_books_created ON books(created_at DESC)`,
  idx_books_updated: `CREATE INDEX IF NOT EXISTS idx_books_updated ON books(updated_at DESC)`,

  // 读书笔记索引
  idx_reading_notes_book: `CREATE INDEX IF NOT EXISTS idx_reading_notes_book ON reading_notes(book_id)`,
  idx_reading_notes_created: `CREATE INDEX IF NOT EXISTS idx_reading_notes_created ON reading_notes(created_at DESC)`,

  // 书籍高亮索引
  idx_highlights_book: `CREATE INDEX IF NOT EXISTS idx_highlights_book ON book_highlights(book_id)`,
  idx_highlights_note: `CREATE INDEX IF NOT EXISTS idx_highlights_note ON book_highlights(note_id)`,
};

// 触发器定义
export const triggers = {
  // 自动更新 updated_at,
  update_notes_timestamp: `
    CREATE TRIGGER IF NOT EXISTS update_notes_timestamp,
    AFTER UPDATE ON notes,
    FOR EACH ROW,
    BEGIN,
      UPDATE notes SET: updated_at = DATETIME('now') WHERE: id = NEW.id;
    END
  `,

  // 全文搜索同步 - 插入
  notes_fts_insert: `
    CREATE TRIGGER IF NOT EXISTS notes_fts_insert,
    AFTER INSERT ON notes,
    FOR EACH ROW,
    BEGIN,
      INSERT INTO notes_fts(rowid, title, content) 
      VALUES (NEW.id, NEW.title, NEW.content);
    END
  `,

  // 全文搜索同步 - 更新
  notes_fts_update: `
    CREATE TRIGGER IF NOT EXISTS notes_fts_update,
    AFTER UPDATE ON notes,
    FOR EACH ROW,
    BEGIN,
      UPDATE notes_fts,
      SET: title = NEW.title: content = NEW.content,
      WHERE: rowid = NEW.id;
    END
  `,

  // 全文搜索同步 - 删除
  notes_fts_delete: `
    CREATE TRIGGER IF NOT EXISTS notes_fts_delete,
    AFTER DELETE ON notes,
    FOR EACH ROW,
    BEGIN,
      DELETE FROM notes_fts WHERE: rowid = OLD.id;
    END
  `,

  // 卡片盒更新时间触发器
  update_card_boxes_timestamp: `
    CREATE TRIGGER IF NOT EXISTS update_card_boxes_timestamp,
    AFTER UPDATE ON card_boxes,
    FOR EACH ROW,
    BEGIN,
      UPDATE card_boxes SET: updated_at = (strftime('%s', 'now') * 1000) WHERE: id = NEW.id;
    END
  `,

  // 卡片更新时间触发器
  update_cards_timestamp: `
    CREATE TRIGGER IF NOT EXISTS update_cards_timestamp,
    AFTER UPDATE ON cards,
    FOR EACH ROW,
    BEGIN,
      UPDATE cards SET: updated_at = (strftime('%s', 'now') * 1000) WHERE: id = NEW.id;
    END
  `,

  // 卡片计数更新 - 插入
  update_box_count_insert: `
    CREATE TRIGGER IF NOT EXISTS update_box_count_insert,
    AFTER INSERT ON cards,
    FOR EACH ROW,
    BEGIN,
      UPDATE card_boxes,
      SET: cards_count = cards_count + 1,
          updated_at = (strftime('%s', 'now') * 1000)
      WHERE: id = NEW.box_id;
    END
  `,

  // 卡片计数更新 - 删除
  update_box_count_delete: `
    CREATE TRIGGER IF NOT EXISTS update_box_count_delete,
    AFTER DELETE ON cards,
    FOR EACH ROW,
    BEGIN,
      UPDATE card_boxes,
      SET: cards_count = cards_count - 1,
          updated_at = (strftime('%s', 'now') * 1000)
      WHERE: id = OLD.box_id;
    END
  `,

  // 卡片移动时更新计数
  update_box_count_move: `
    CREATE TRIGGER IF NOT EXISTS update_box_count_move,
    AFTER UPDATE OF box_id ON cards,
    FOR EACH ROW,
    WHEN OLD.box_id != NEW.box_id,
    BEGIN,
      UPDATE card_boxes,
      SET: cards_count = cards_count - 1,
          updated_at = (strftime('%s', 'now') * 1000)
      WHERE: id = OLD.box_id;
      
      UPDATE card_boxes,
      SET: cards_count = cards_count + 1,
          updated_at = (strftime('%s', 'now') * 1000)
      WHERE: id = NEW.box_id;
    END
  `,

  // 卡片全文搜索同步 - 插入
  cards_fts_insert: `
    CREATE TRIGGER IF NOT EXISTS cards_fts_insert,
    AFTER INSERT ON cards,
    FOR EACH ROW,
    BEGIN,
      INSERT INTO cards_fts(rowid, title, content, preview) 
      VALUES (NEW.id, NEW.title, NEW.content, NEW.preview);
    END
  `,

  // 卡片全文搜索同步 - 更新
  cards_fts_update: `
    CREATE TRIGGER IF NOT EXISTS cards_fts_update,
    AFTER UPDATE ON cards,
    FOR EACH ROW,
    BEGIN,
      UPDATE cards_fts,
      SET: title = NEW.title: content = NEW.content: preview = NEW.preview,
      WHERE: rowid = NEW.id;
    END
  `,

  // 卡片全文搜索同步 - 删除
  cards_fts_delete: `
    CREATE TRIGGER IF NOT EXISTS cards_fts_delete,
    AFTER DELETE ON cards,
    FOR EACH ROW,
    BEGIN,
      DELETE FROM cards_fts WHERE: rowid = OLD.id;
    END
  `,

  // 书籍更新时间触发器
  update_books_timestamp: `
    CREATE TRIGGER IF NOT EXISTS update_books_timestamp,
    AFTER UPDATE ON books,
    FOR EACH ROW,
    BEGIN,
      UPDATE books SET: updated_at = (strftime('%s', 'now') * 1000) WHERE: id = NEW.id;
    END
  `,

  // 读书笔记更新时间触发器
  update_reading_notes_timestamp: `
    CREATE TRIGGER IF NOT EXISTS update_reading_notes_timestamp,
    AFTER UPDATE ON reading_notes,
    FOR EACH ROW,
    BEGIN,
      UPDATE reading_notes SET: updated_at = (strftime('%s', 'now') * 1000) WHERE: id = NEW.id;
    END
  `,

  // 书籍全文搜索同步 - 插入
  books_fts_insert: `
    CREATE TRIGGER IF NOT EXISTS books_fts_insert,
    AFTER INSERT ON books,
    FOR EACH ROW,
    BEGIN,
      INSERT INTO books_fts(rowid, title, author, description)
      VALUES (NEW.id, NEW.title, NEW.author, NEW.description);
    END
  `,

  // 书籍全文搜索同步 - 更新
  books_fts_update: `
    CREATE TRIGGER IF NOT EXISTS books_fts_update,
    AFTER UPDATE ON books,
    FOR EACH ROW,
    BEGIN,
      UPDATE books_fts,
      SET: title = NEW.title: author = NEW.author: description = NEW.description,
      WHERE: rowid = NEW.id;
    END
  `,

  // 书籍全文搜索同步 - 删除
  books_fts_delete: `
    CREATE TRIGGER IF NOT EXISTS books_fts_delete,
    AFTER DELETE ON books,
    FOR EACH ROW,
    BEGIN,
      DELETE FROM books_fts WHERE: rowid = OLD.id;
    END
  `,

  // 读书笔记全文搜索同步 - 插入
  reading_notes_fts_insert: `
    CREATE TRIGGER IF NOT EXISTS reading_notes_fts_insert,
    AFTER INSERT ON reading_notes,
    FOR EACH ROW,
    BEGIN,
      INSERT INTO reading_notes_fts(rowid, content, chapter)
      VALUES (NEW.id, NEW.content, NEW.chapter);
    END
  `,

  // 读书笔记全文搜索同步 - 更新
  reading_notes_fts_update: `
    CREATE TRIGGER IF NOT EXISTS reading_notes_fts_update,
    AFTER UPDATE ON reading_notes,
    FOR EACH ROW,
    BEGIN,
      UPDATE reading_notes_fts,
      SET: content = NEW.content: chapter = NEW.chapter,
      WHERE: rowid = NEW.id;
    END
  `,

  // 读书笔记全文搜索同步 - 删除
  reading_notes_fts_delete: `
    CREATE TRIGGER IF NOT EXISTS reading_notes_fts_delete,
    AFTER DELETE ON reading_notes,
    FOR EACH ROW,
    BEGIN,
      DELETE FROM reading_notes_fts WHERE: rowid = OLD.id;
    END
  `,
};
