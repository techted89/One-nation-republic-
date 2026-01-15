import Database from 'better-sqlite3';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// When running from dist/benchmarks/register-benchmark.js:
// __dirname is .../server/dist/benchmarks
// We want to put sqlite in .../server/dist/benchmarks/benchmark.sqlite (or just temp dir)
const DB_PATH = path.join(__dirname, 'benchmark.sqlite');

// Server index is at .../server/dist/index.js
const SERVER_PATH = path.resolve(__dirname, '../index.js');

async function runBenchmark() {
  console.log('Preparing benchmark...');

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }

  const db = new Database(DB_PATH);

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

  const REQUEST_COUNT = 50;
  const insert = db.prepare('INSERT INTO license_keys (key) VALUES (?)');
  const keys: string[] = [];

  const seedTx = db.transaction(() => {
    for (let i = 0; i < REQUEST_COUNT; i++) {
        const key = `BENCH-KEY-${i}`;
        keys.push(key);
        insert.run(key);
    }
  });
  seedTx();

  db.close();
  console.log(`Initialized DB at ${DB_PATH} with ${REQUEST_COUNT} keys.`);

  console.log(`Starting server from ${SERVER_PATH}...`);

  const serverProcess = spawn('node', [SERVER_PATH], {
    env: { ...process.env, DB_PATH: DB_PATH, PORT: '3001' },
    stdio: 'pipe'
  });

  let serverStarted = false;

  serverProcess.stdout.on('data', (data) => {
    // console.log(`Server Out: ${data}`);
    if (data.toString().includes('Server running')) {
      serverStarted = true;
    }
  });

  serverProcess.stderr.on('data', (data) => console.error(`Server Error: ${data}`));

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
    // Give it a moment to ensure socket is listening
    await new Promise(r => setTimeout(r, 500));
    console.log('Server started. Running requests...');

    const startTime = performance.now();

    const requests = keys.map((key, i) => {
      return fetch('http://127.0.0.1:3001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: key,
          email: `user${i}@example.com`,
          password: 'password123',
          fullName: `User ${i}`,
          deviceHash: `device-hash-${i}`,
          userAgent: 'Benchmark-Agent'
        })
      }).then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Request failed: ${res.status} ${text}`);
        }
        return res.json();
      });
    });

    await Promise.all(requests);
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    const rps = REQUEST_COUNT / duration;

    console.log(`\nResults:`);
    console.log(`Total Requests: ${REQUEST_COUNT}`);
    console.log(`Total Time: ${duration.toFixed(3)}s`);
    console.log(`Throughput: ${rps.toFixed(2)} req/sec`);

  } catch (err) {
    console.error('Benchmark failed:', err);
  } finally {
    serverProcess.kill();
    // Allow server some time to release lock if needed
    // On Windows unlinking immediately might fail if process not fully dead, but on Linux usually fine.
    // We'll just exit.
    process.exit(0);
  }
}

runBenchmark();
