"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDb = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const db = new better_sqlite3_1.default('database.sqlite');
const initDb = () => {
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
    const result = stmt.get();
    if (result.count === 0) {
        const insert = db.prepare('INSERT INTO license_keys (key) VALUES (?)');
        const keys = ['ONE-NATION-ALPHA', 'LIBERTY-2025', 'TRUST-LAW-DEV'];
        keys.forEach(key => insert.run(key));
        console.log('Seeded license keys:', keys);
    }
};
exports.initDb = initDb;
exports.default = db;
//# sourceMappingURL=db.js.map