
import express from 'express';
import db, { initDb } from './db.js';
import router from './routes.js';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';

async function verify() {
  console.log('Starting Verification...');

  // 1. Init DB to ensure tables
  initDb();

  // 2. Insert License Key
  const licenseKey = `TEST-KEY-${Date.now()}`;
  try {
    db.prepare('INSERT INTO license_keys (key, status) VALUES (?, ?)').run(licenseKey, 'active');
    console.log(`Inserted license key: ${licenseKey}`);
  } catch (e) {
    console.error('Failed to insert license key', e);
    process.exit(1);
  }

  // 3. Setup App
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/', router);

  const server = app.listen(0, async () => {
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    const baseUrl = `http://localhost:${port}`;
    console.log(`Test server running at ${baseUrl}`);

    // 4. Register
    const email = `testuser_${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    try {
      const res = await fetch(`${baseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey,
          email,
          password,
          fullName: 'Verification User',
          deviceHash: 'device-123',
          userAgent: 'test-agent'
        })
      });

      const data = await res.json() as any;

      if (res.status === 200 && data.success) {
        console.log('Registration Successful:', data);

        // 5. Verify DB State
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
        if (user) {
          console.log('User found in DB:', user.id);
          // Verify hash
          if (bcrypt.compareSync(password, user.password_hash)) {
             console.log('Password hash verified.');
          } else {
             console.error('Password hash mismatch!');
             process.exit(1);
          }
        } else {
          console.error('User NOT found in DB!');
          process.exit(1);
        }

      } else {
        console.error('Registration Failed:', res.status, data);
        process.exit(1);
      }
    } catch (err) {
      console.error('Error during request:', err);
      process.exit(1);
    } finally {
      server.close();
      // Ensure we don't hang if db connection is open? better-sqlite3 is sync usually.
      process.exit(0);
    }
  });
}

verify();
