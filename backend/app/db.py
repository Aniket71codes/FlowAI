import logging
import os
import sqlite3
import tempfile
from contextlib import contextmanager
from datetime import datetime, timezone

SCHEMA = """
CREATE TABLE IF NOT EXISTS notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT,
  priority    TEXT NOT NULL DEFAULT 'medium',
  status      TEXT NOT NULL DEFAULT 'todo',
  due_date    TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS resume_sections (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  section_type TEXT NOT NULL,
  title        TEXT,
  content      TEXT NOT NULL,
  order_idx    INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS flashcards (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  deck_name  TEXT NOT NULL DEFAULT 'default',
  created_at TEXT NOT NULL
);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Database:
    def __init__(self, path: str) -> None:
        self.path = path if self._writable(path) else self._fallback(path)

    @staticmethod
    def _writable(path: str) -> bool:
        try:
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
            c = sqlite3.connect(path, timeout=15)
            c.execute("CREATE TABLE IF NOT EXISTS _probe(x)")
            c.execute("DROP TABLE _probe")
            c.commit()
            c.close()
            return True
        except Exception:
            return False

    @staticmethod
    def _fallback(path: str) -> str:
        fb = os.path.join(tempfile.gettempdir(), "flowai.db")
        logging.getLogger("db").warning("Cannot write db at %s; falling back to %s", path, fb)
        return fb

    @contextmanager
    def conn(self):
        c = sqlite3.connect(self.path, timeout=15)
        c.row_factory = sqlite3.Row
        try:
            yield c
            c.commit()
        finally:
            c.close()

    def init(self) -> None:
        with self.conn() as c:
            c.executescript(SCHEMA)

    def ping(self) -> bool:
        try:
            with self.conn() as c:
                c.execute("SELECT 1").fetchone()
            return True
        except Exception:
            return False

    # ── Notes ─────────────────────────────────────────────────────────────────

    def list_notes(self):
        with self.conn() as c:
            rows = c.execute("SELECT * FROM notes ORDER BY updated_at DESC").fetchall()
        return [dict(r) for r in rows]

    def get_note(self, note_id: int):
        with self.conn() as c:
            r = c.execute("SELECT * FROM notes WHERE id=?", (note_id,)).fetchone()
        return dict(r) if r else None

    def create_note(self, title: str, content: str):
        now = _now()
        with self.conn() as c:
            cur = c.execute(
                "INSERT INTO notes(title, content, created_at, updated_at) VALUES(?,?,?,?)",
                (title, content, now, now),
            )
            return dict(c.execute("SELECT * FROM notes WHERE id=?", (cur.lastrowid,)).fetchone())

    def update_note(self, note_id: int, title: str, content: str):
        with self.conn() as c:
            c.execute(
                "UPDATE notes SET title=?, content=?, updated_at=? WHERE id=?",
                (title, content, _now(), note_id),
            )
            r = c.execute("SELECT * FROM notes WHERE id=?", (note_id,)).fetchone()
        return dict(r) if r else None

    def delete_note(self, note_id: int) -> bool:
        with self.conn() as c:
            cur = c.execute("DELETE FROM notes WHERE id=?", (note_id,))
        return cur.rowcount > 0

    # ── Tasks ─────────────────────────────────────────────────────────────────

    def list_tasks(self):
        with self.conn() as c:
            rows = c.execute(
                "SELECT * FROM tasks ORDER BY CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, created_at DESC"
            ).fetchall()
        return [dict(r) for r in rows]

    def create_task(self, title: str, description, priority: str, due_date):
        now = _now()
        with self.conn() as c:
            cur = c.execute(
                "INSERT INTO tasks(title, description, priority, status, due_date, created_at, updated_at) VALUES(?,?,'todo',?,?,?,?)",
                (title, description, priority, due_date, now, now),
            )
            return dict(c.execute("SELECT * FROM tasks WHERE id=?", (cur.lastrowid,)).fetchone())

    def update_task(self, task_id: int, title, description, priority, status, due_date):
        with self.conn() as c:
            c.execute(
                "UPDATE tasks SET title=?, description=?, priority=?, status=?, due_date=?, updated_at=? WHERE id=?",
                (title, description, priority, status, due_date, _now(), task_id),
            )
            r = c.execute("SELECT * FROM tasks WHERE id=?", (task_id,)).fetchone()
        return dict(r) if r else None

    def delete_task(self, task_id: int) -> bool:
        with self.conn() as c:
            cur = c.execute("DELETE FROM tasks WHERE id=?", (task_id,))
        return cur.rowcount > 0

    # ── Resume ────────────────────────────────────────────────────────────────

    def list_resume_sections(self):
        with self.conn() as c:
            rows = c.execute("SELECT * FROM resume_sections ORDER BY order_idx ASC, id ASC").fetchall()
        return [dict(r) for r in rows]

    def get_resume_section(self, section_id: int):
        with self.conn() as c:
            r = c.execute("SELECT * FROM resume_sections WHERE id=?", (section_id,)).fetchone()
        return dict(r) if r else None

    def create_resume_section(self, section_type: str, title, content: str, order_idx: int):
        now = _now()
        with self.conn() as c:
            cur = c.execute(
                "INSERT INTO resume_sections(section_type, title, content, order_idx, created_at, updated_at) VALUES(?,?,?,?,?,?)",
                (section_type, title, content, order_idx, now, now),
            )
            return dict(c.execute("SELECT * FROM resume_sections WHERE id=?", (cur.lastrowid,)).fetchone())

    def update_resume_section(self, section_id: int, title, content: str):
        with self.conn() as c:
            c.execute(
                "UPDATE resume_sections SET title=?, content=?, updated_at=? WHERE id=?",
                (title, content, _now(), section_id),
            )
            r = c.execute("SELECT * FROM resume_sections WHERE id=?", (section_id,)).fetchone()
        return dict(r) if r else None

    def delete_resume_section(self, section_id: int) -> bool:
        with self.conn() as c:
            cur = c.execute("DELETE FROM resume_sections WHERE id=?", (section_id,))
        return cur.rowcount > 0

    # ── Flashcards ────────────────────────────────────────────────────────────

    def list_flashcards(self, deck: str = None):
        with self.conn() as c:
            if deck:
                rows = c.execute(
                    "SELECT * FROM flashcards WHERE deck_name=? ORDER BY id DESC", (deck,)
                ).fetchall()
            else:
                rows = c.execute("SELECT * FROM flashcards ORDER BY id DESC").fetchall()
        return [dict(r) for r in rows]

    def create_flashcard(self, question: str, answer: str, deck_name: str):
        now = _now()
        with self.conn() as c:
            cur = c.execute(
                "INSERT INTO flashcards(question, answer, deck_name, created_at) VALUES(?,?,?,?)",
                (question, answer, deck_name, now),
            )
            return dict(c.execute("SELECT * FROM flashcards WHERE id=?", (cur.lastrowid,)).fetchone())

    def delete_flashcard(self, card_id: int) -> bool:
        with self.conn() as c:
            cur = c.execute("DELETE FROM flashcards WHERE id=?", (card_id,))
        return cur.rowcount > 0
