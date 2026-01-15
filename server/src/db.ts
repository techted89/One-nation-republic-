
import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || 'database.sqlite';
const db = new Database(dbPath);

export const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS license_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      status TEXT CHECK(status IN ('active', 'used')) NOT NULL DEFAULT 'active',
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_hash TEXT NOT NULL,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Seed some license keys if none exist
  const stmt = db.prepare('SELECT count(*) as count FROM license_keys');
  const result = stmt.get() as { count: number };

  if (result.count === 0) {
    const insert = db.prepare('INSERT INTO license_keys (key) VALUES (?)');
    const keys = ['ONE-NATION-ALPHA', 'LIBERTY-2025', 'TRUST-LAW-DEV'];
    keys.forEach(key => insert.run(key));
    console.log('Seeded license keys:', keys);
  }
};

export default db;
