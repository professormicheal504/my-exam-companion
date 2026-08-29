DROP TABLE IF EXISTS reactions;
CREATE TABLE reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, exam_id, question_id)
);

DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  text TEXT NOT NULL,
  parent_id INTEGER DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

DROP TABLE IF EXISTS user_answers;
CREATE TABLE user_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  exam_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_option TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, exam_id, question_id)
);
