
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const iterations = 20;

function runBenchmark() {
  console.log('Starting Performance Benchmark...\n');

  // Setup DB
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL
    );
  `);

  const password = 'my-secure-password';
  const emailBase = 'user';

  // --- CASE A: Hashing INSIDE Transaction (Current) ---
  let totalTimeA = 0;
  for (let i = 0; i < iterations; i++) {
    const email = `${emailBase}_a_${i}@example.com`;

    const start = process.hrtime.bigint();

    const tx = db.transaction(() => {
      // Simulate the expensive operation inside the lock
      const hash = bcrypt.hashSync(password, 10);

      const stmt = db.prepare('INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)');
      stmt.run(email, hash, 'Test User');
    });

    tx();

    const end = process.hrtime.bigint();
    totalTimeA += Number(end - start);
  }

  const avgTimeA = (totalTimeA / iterations) / 1_000_000; // ms
  console.log(`Case A (Hash INSIDE Tx): ${avgTimeA.toFixed(4)} ms per transaction`);

  // --- CASE B: Hashing OUTSIDE Transaction (Optimized) ---
  let totalTimeB = 0;
  for (let i = 0; i < iterations; i++) {
    const email = `${emailBase}_b_${i}@example.com`;

    // Hashing happens here, outside timing of the transaction
    // Note: We are benchmarking the TRANSACTION LOCK duration, not the total request time.
    // The total CPU time is roughly the same, but the DB lock time is what we want to minimize.
    const hash = bcrypt.hashSync(password, 10);

    const start = process.hrtime.bigint();

    const tx = db.transaction(() => {
      const stmt = db.prepare('INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)');
      stmt.run(email, hash, 'Test User');
    });

    tx();

    const end = process.hrtime.bigint();
    totalTimeB += Number(end - start);
  }

  const avgTimeB = (totalTimeB / iterations) / 1_000_000; // ms
  console.log(`Case B (Hash OUTSIDE Tx): ${avgTimeB.toFixed(4)} ms per transaction`);

  const improvement = avgTimeA / avgTimeB;
  console.log(`\nImprovement: Transaction lock time is ~${improvement.toFixed(1)}x shorter.`);
}

runBenchmark();
