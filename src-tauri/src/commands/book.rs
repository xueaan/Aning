use crate::database::Database;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;
use tauri::State;

type DbResult<T> = Result<T, String>;

#[derive(Debug, Serialize, Deserialize)]
pub struct Book {
    pub id: String,
    pub title: String,
    pub author: Option<String>,
    pub isbn: Option<String>,
    pub cover: Option<String>,
    pub status: String,
    pub total_pages: Option<i32>,
    pub current_page: i32,
    pub rating: Option<i32>,
    pub tags: Option<String>,
    pub description: Option<String>,
    pub start_date: Option<i64>,
    pub finish_date: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BookCreate {
    pub title: String,
    pub author: Option<String>,
    pub isbn: Option<String>,
    pub cover: Option<String>,
    pub status: Option<String>,
    pub total_pages: Option<i32>,
    pub current_page: Option<i32>,
    pub rating: Option<i32>,
    pub tags: Option<String>,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BookUpdate {
    pub title: Option<String>,
    pub author: Option<String>,
    pub isbn: Option<String>,
    pub cover: Option<String>,
    pub status: Option<String>,
    pub total_pages: Option<i32>,
    pub current_page: Option<i32>,
    pub rating: Option<i32>,
    pub tags: Option<String>,
    pub description: Option<String>,
    pub start_date: Option<i64>,
    pub finish_date: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReadingNote {
    pub id: String,
    pub book_id: String,
    pub chapter: Option<String>,
    pub page_number: Option<i32>,
    pub content: String,
    pub note_type: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReadingNoteCreate {
    pub book_id: String,
    pub chapter: Option<String>,
    pub page_number: Option<i32>,
    pub content: String,
    pub note_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BookHighlight {
    pub id: String,
    pub book_id: String,
    pub note_id: Option<String>,
    pub text: String,
    pub page_number: Option<i32>,
    pub color: String,
    pub notes: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BookHighlightCreate {
    pub book_id: String,
    pub note_id: Option<String>,
    pub text: String,
    pub page_number: Option<i32>,
    pub color: Option<String>,
    pub notes: Option<String>,
}

// 书籍相关命令
#[tauri::command]
pub async fn get_books(
    db: State<'_, Arc<Database>>,
    status: Option<String>,
) -> DbResult<Vec<Book>> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut query = String::from(
        "SELECT id, title, author, isbn, cover, status, total_pages, current_page,
         rating, tags, description, start_date, finish_date, created_at, updated_at
         FROM books"
    );

    if let Some(status) = status {
        query.push_str(&format!(" WHERE status = '{}'", status));
    }

    query.push_str(" ORDER BY updated_at DESC");

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let books = stmt.query_map([], |row| {
        Ok(Book {
            id: row.get(0)?,
            title: row.get(1)?,
            author: row.get(2)?,
            isbn: row.get(3)?,
            cover: row.get(4)?,
            status: row.get(5)?,
            total_pages: row.get(6)?,
            current_page: row.get(7)?,
            rating: row.get(8)?,
            tags: row.get(9)?,
            description: row.get(10)?,
            start_date: row.get(11)?,
            finish_date: row.get(12)?,
            created_at: row.get(13)?,
            updated_at: row.get(14)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(books)
}

#[tauri::command]
pub async fn get_book_by_id(
    db: State<'_, Arc<Database>>,
    book_id: String,
) -> DbResult<Option<Book>> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, title, author, isbn, cover, status, total_pages, current_page,
         rating, tags, description, start_date, finish_date, created_at, updated_at
         FROM books WHERE id = ?1"
    ).map_err(|e| e.to_string())?;

    let book = stmt.query_row([book_id], |row| {
        Ok(Book {
            id: row.get(0)?,
            title: row.get(1)?,
            author: row.get(2)?,
            isbn: row.get(3)?,
            cover: row.get(4)?,
            status: row.get(5)?,
            total_pages: row.get(6)?,
            current_page: row.get(7)?,
            rating: row.get(8)?,
            tags: row.get(9)?,
            description: row.get(10)?,
            start_date: row.get(11)?,
            finish_date: row.get(12)?,
            created_at: row.get(13)?,
            updated_at: row.get(14)?,
        })
    }).ok();

    Ok(book)
}

#[tauri::command]
pub async fn create_book(
    db: State<'_, Arc<Database>>,
    book: BookCreate,
) -> DbResult<Book> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    let status = book.status.unwrap_or_else(|| "wanted".to_string());
    let current_page = book.current_page.unwrap_or(0);

    conn.execute(
        "INSERT INTO books (id, title, author, isbn, cover, status, total_pages,
         current_page, rating, tags, description, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        rusqlite::params![
            id,
            book.title,
            book.author,
            book.isbn,
            book.cover,
            status,
            book.total_pages,
            current_page,
            book.rating,
            book.tags,
            book.description,
            now,
            now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(Book {
        id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        cover: book.cover,
        status,
        total_pages: book.total_pages,
        current_page,
        rating: book.rating,
        tags: book.tags,
        description: book.description,
        start_date: None,
        finish_date: None,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn update_book(
    db: State<'_, Arc<Database>>,
    id: String,
    updates: BookUpdate,
) -> DbResult<()> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp_millis();

    // 构建动态更新语句
    let mut update_fields = vec!["updated_at = ?1".to_string()];
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(now)];
    let mut param_index = 2;

    if let Some(title) = updates.title {
        update_fields.push(format!("title = ?{}", param_index));
        params.push(Box::new(title));
        param_index += 1;
    }

    if let Some(author) = updates.author {
        update_fields.push(format!("author = ?{}", param_index));
        params.push(Box::new(author));
        param_index += 1;
    }

    if let Some(isbn) = updates.isbn {
        update_fields.push(format!("isbn = ?{}", param_index));
        params.push(Box::new(isbn));
        param_index += 1;
    }

    if let Some(cover) = updates.cover {
        update_fields.push(format!("cover = ?{}", param_index));
        params.push(Box::new(cover));
        param_index += 1;
    }

    if let Some(status) = updates.status {
        update_fields.push(format!("status = ?{}", param_index));
        params.push(Box::new(status));
        param_index += 1;
    }

    if let Some(total_pages) = updates.total_pages {
        update_fields.push(format!("total_pages = ?{}", param_index));
        params.push(Box::new(total_pages));
        param_index += 1;
    }

    if let Some(current_page) = updates.current_page {
        update_fields.push(format!("current_page = ?{}", param_index));
        params.push(Box::new(current_page));
        param_index += 1;
    }

    if let Some(rating) = updates.rating {
        update_fields.push(format!("rating = ?{}", param_index));
        params.push(Box::new(rating));
        param_index += 1;
    }

    if let Some(tags) = updates.tags {
        update_fields.push(format!("tags = ?{}", param_index));
        params.push(Box::new(tags));
        param_index += 1;
    }

    if let Some(description) = updates.description {
        update_fields.push(format!("description = ?{}", param_index));
        params.push(Box::new(description));
        param_index += 1;
    }

    if let Some(start_date) = updates.start_date {
        update_fields.push(format!("start_date = ?{}", param_index));
        params.push(Box::new(start_date));
        param_index += 1;
    }

    if let Some(finish_date) = updates.finish_date {
        update_fields.push(format!("finish_date = ?{}", param_index));
        params.push(Box::new(finish_date));
        param_index += 1;
    }

    update_fields.push(format!("id = ?{}", param_index));
    params.push(Box::new(id));

    let query = format!(
        "UPDATE books SET {} WHERE id = ?{}",
        update_fields[..update_fields.len()-1].join(", "),
        param_index
    );

    conn.execute(&query, rusqlite::params_from_iter(params.iter())).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_book(
    db: State<'_, Arc<Database>>,
    id: String,
) -> DbResult<()> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM books WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

// 读书笔记相关命令
#[tauri::command]
pub async fn get_reading_notes(
    db: State<'_, Arc<Database>>,
    book_id: String,
) -> DbResult<Vec<ReadingNote>> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, book_id, chapter, page_number, content, note_type, created_at, updated_at
         FROM reading_notes WHERE book_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let notes = stmt.query_map([book_id], |row| {
        Ok(ReadingNote {
            id: row.get(0)?,
            book_id: row.get(1)?,
            chapter: row.get(2)?,
            page_number: row.get(3)?,
            content: row.get(4)?,
            note_type: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(notes)
}

#[tauri::command]
pub async fn create_reading_note(
    db: State<'_, Arc<Database>>,
    note: ReadingNoteCreate,
) -> DbResult<ReadingNote> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    let note_type = note.note_type.unwrap_or_else(|| "note".to_string());

    conn.execute(
        "INSERT INTO reading_notes (id, book_id, chapter, page_number, content, note_type, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![
            id,
            note.book_id,
            note.chapter,
            note.page_number,
            note.content,
            note_type,
            now,
            now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(ReadingNote {
        id,
        book_id: note.book_id,
        chapter: note.chapter,
        page_number: note.page_number,
        content: note.content,
        note_type,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub async fn delete_reading_note(
    db: State<'_, Arc<Database>>,
    id: String,
) -> DbResult<()> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM reading_notes WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

// 高亮句子相关命令
#[tauri::command]
pub async fn get_book_highlights(
    db: State<'_, Arc<Database>>,
    book_id: String,
) -> DbResult<Vec<BookHighlight>> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, book_id, note_id, text, page_number, color, notes, created_at
         FROM book_highlights WHERE book_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let highlights = stmt.query_map([book_id], |row| {
        Ok(BookHighlight {
            id: row.get(0)?,
            book_id: row.get(1)?,
            note_id: row.get(2)?,
            text: row.get(3)?,
            page_number: row.get(4)?,
            color: row.get(5)?,
            notes: row.get(6)?,
            created_at: row.get(7)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(highlights)
}

#[tauri::command]
pub async fn create_book_highlight(
    db: State<'_, Arc<Database>>,
    highlight: BookHighlightCreate,
) -> DbResult<BookHighlight> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp_millis();
    let color = highlight.color.unwrap_or_else(|| "yellow".to_string());

    conn.execute(
        "INSERT INTO book_highlights (id, book_id, note_id, text, page_number, color, notes, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![
            id,
            highlight.book_id,
            highlight.note_id,
            highlight.text,
            highlight.page_number,
            color,
            highlight.notes,
            now,
        ],
    ).map_err(|e| e.to_string())?;

    Ok(BookHighlight {
        id,
        book_id: highlight.book_id,
        note_id: highlight.note_id,
        text: highlight.text,
        page_number: highlight.page_number,
        color,
        notes: highlight.notes,
        created_at: now,
    })
}

#[tauri::command]
pub async fn delete_book_highlight(
    db: State<'_, Arc<Database>>,
    id: String,
) -> DbResult<()> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM book_highlights WHERE id = ?1", [id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn search_books(
    db: State<'_, Arc<Database>>,
    query: String,
) -> DbResult<Vec<Book>> {
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT DISTINCT b.id, b.title, b.author, b.isbn, b.cover, b.status,
         b.total_pages, b.current_page, b.rating, b.tags, b.description,
         b.start_date, b.finish_date, b.created_at, b.updated_at
         FROM books b
         LEFT JOIN books_fts ON books_fts.rowid = b.id
         WHERE books_fts MATCH ?1 OR b.tags LIKE ?2
         ORDER BY b.updated_at DESC"
    ).map_err(|e| e.to_string())?;

    let search_pattern = format!("%{}%", query);
    let books = stmt.query_map([&query, &search_pattern], |row| {
        Ok(Book {
            id: row.get(0)?,
            title: row.get(1)?,
            author: row.get(2)?,
            isbn: row.get(3)?,
            cover: row.get(4)?,
            status: row.get(5)?,
            total_pages: row.get(6)?,
            current_page: row.get(7)?,
            rating: row.get(8)?,
            tags: row.get(9)?,
            description: row.get(10)?,
            start_date: row.get(11)?,
            finish_date: row.get(12)?,
            created_at: row.get(13)?,
            updated_at: row.get(14)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(books)
}