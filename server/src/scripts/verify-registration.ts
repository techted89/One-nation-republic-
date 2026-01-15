import Database from 'better-sqlite3';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// paths relative to dist/scripts/verify-registration.js
const DB_PATH = path.join(__dirname, 'verify.sqlite');
const SERVER_PATH = path.resolve(__dirname, '../index.js');

async function verify() {
  console.log('Preparing verification...');

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  const db = new Database(DB_PATH);

  // Create Schema
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

  const TEST_KEY = 'TEST-KEY-123';
  db.prepare('INSERT INTO license_keys (key) VALUES (?)').run(TEST_KEY);
  db.close();

  console.log('Starting server...');
  const serverProcess = spawn('node', [SERVER_PATH], {
    env: { ...process.env, DB_PATH: DB_PATH, PORT: '3002' },
    stdio: 'pipe'
  });

  let serverStarted = false;
  serverProcess.stdout.on('data', d => {
    if (d.toString().includes('Server running')) serverStarted = true;
  });
  serverProcess.stderr.on('data', d => console.error(`Server Error: ${d}`));

  const waitForServer = async () => {
    let attempts = 0;
    while (!serverStarted && attempts < 50) {
      await new Promise(r => setTimeout(r, 100));
      attempts++;
    }
    if (!serverStarted) throw new Error("Server failed to start");
  };

  try {
    await waitForServer();
    await new Promise(r => setTimeout(r, 500));
    console.log('Server started.');

    // REGISTER
    console.log('Registering user...');
    const res = await fetch('http://127.0.0.1:3002/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        licenseKey: TEST_KEY,
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        deviceHash: 'device-123',
        userAgent: 'TestBot'
      })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Registration failed: ${res.status} ${text}`);
    }

    const data = await res.json();
    console.log('Registration Response:', data);

    if (data.success && data.user.email === 'test@example.com') {
        console.log('✅ Registration SUCCESS');
    } else {
        throw new Error('Verification Failed: Invalid response');
    }

    // Double check DB
    const dbCheck = new Database(DB_PATH);
    const user = dbCheck.prepare('SELECT * FROM users WHERE email = ?').get('test@example.com') as any;
    if (!user) throw new Error('User not found in DB');
    console.log('✅ User found in DB:', user.id);
    dbCheck.close();

  } catch (err) {
    console.error('❌ Verification FAILED:', err);
    process.exit(1);
  } finally {
    serverProcess.kill();
    // Use try-catch for cleanup to avoid crash on exit if file locked
    try {
        if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
    } catch (e) {}
  }
}

verify();
