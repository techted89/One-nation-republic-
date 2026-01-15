
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import db from './db.js';

const router = Router();
const JWT_SECRET = 'super-secret-key-change-this-in-prod'; // In prod use env var

// Types
interface LicenseKey {
  id: number;
  key: string;
  status: 'active' | 'used';
  user_id: number | null;
}

interface User {
  id: number;
  email: string;
  password_hash: string;
  full_name: string;
}

interface Device {
  id: number;
  user_id: number;
  device_hash: string;
}

// --- Auth Routes ---

// Validate License Key
router.post('/validate-license', (req, res) => {
  const { licenseKey } = req.body;
  if (!licenseKey) return res.status(400).json({ error: 'License key required' });

  const stmt = db.prepare('SELECT * FROM license_keys WHERE key = ?');
  const key = stmt.get(licenseKey) as LicenseKey | undefined;

  if (!key) {
    return res.status(404).json({ valid: false, message: 'Invalid license key' });
  }

  if (key.status === 'used') {
    return res.status(409).json({ valid: false, message: 'License key already used' });
  }

  return res.json({ valid: true, message: 'License key available' });
});

// Register
router.post('/register', async (req, res) => {
  const { licenseKey, email, password, fullName, deviceHash, userAgent } = req.body;

  if (!licenseKey || !email || !password || !fullName || !deviceHash) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // 1. Verify License again
  const keyStmt = db.prepare('SELECT * FROM license_keys WHERE key = ?');
  const key = keyStmt.get(licenseKey) as LicenseKey | undefined;

  if (!key || key.status !== 'active') {
    return res.status(400).json({ error: 'Invalid or used license key' });
  }

  // 2. Check if email exists
  const userStmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const existingUser = userStmt.get(email);
  if (existingUser) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  // 3. Create User & Update License & Add Device (Transaction)
  const hashedPassword = bcrypt.hashSync(password, 10);

  const registerTx = db.transaction(() => {
    const insertUser = db.prepare('INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)');
    const result = insertUser.run(email, hashedPassword, fullName);
    const userId = result.lastInsertRowid;

    const updateLicense = db.prepare('UPDATE license_keys SET status = ?, user_id = ? WHERE id = ?');
    updateLicense.run('used', userId, key.id);

    const insertDevice = db.prepare('INSERT INTO user_devices (user_id, device_hash, user_agent) VALUES (?, ?, ?)');
    insertDevice.run(userId, deviceHash, userAgent || '');

    return userId;
  });

  try {
    const userId = registerTx();

    // Generate Token
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, { httpOnly: true, secure: false }); // secure: true in prod
    res.json({ success: true, user: { id: userId, email, fullName } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password, deviceHash, userAgent } = req.body;

  if (!email || !password || !deviceHash) {
    return res.status(400).json({ error: 'Email, password, and device ID required' });
  }

  const userStmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = userStmt.get(email) as User | undefined;

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Device Locking Logic
  const devicesStmt = db.prepare('SELECT * FROM user_devices WHERE user_id = ?');
  const devices = devicesStmt.all(user.id) as Device[];

  const knownDevice = devices.find(d => d.device_hash === deviceHash);

  if (!knownDevice) {
    if (devices.length >= 2) {
      return res.status(403).json({ error: 'Device limit reached (Max 2). Contact support to reset.' });
    } else {
      // Add new device
      const insertDevice = db.prepare('INSERT INTO user_devices (user_id, device_hash, user_agent) VALUES (?, ?, ?)');
      insertDevice.run(user.id, deviceHash, userAgent || '');
    }
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
  res.cookie('token', token, { httpOnly: true, secure: false });
  res.json({ success: true, user: { id: user.id, email: user.email, fullName: user.full_name } });
});

// Middleware for Protected Routes
const authenticate = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/me', authenticate, (req: any, res) => {
  const userStmt = db.prepare('SELECT id, email, full_name FROM users WHERE id = ?');
  const user = userStmt.get(req.user.userId);
  res.json(user);
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// Mock Data for Library
router.get('/library', authenticate, (req, res) => {
  const documents = [
    { id: 1, title: 'Foundations of Trust Law', type: 'PDF', category: 'Trust Law' },
    { id: 2, title: 'Living Sui Juris Guide', type: 'PDF', category: 'Sovereignty' },
    { id: 3, title: 'Affidavit Templates', type: 'DOCX', category: 'Templates' },
    { id: 4, title: 'Private Contract Basics', type: 'Video', category: 'Contracts' },
  ];
  res.json(documents);
});

// Secure Download Endpoint with Dynamic Watermarking
router.get('/download/:docId', authenticate, async (req: any, res) => {
  const docId = req.params.docId;
  const user = req.user; // From jwt middleware

  try {
    // In a real app, verify docId exists and fetch file path
    // For demo, we generate a PDF on the fly

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Content
    page.drawText(`One Nation Republic - Document #${docId}`, {
      x: 50,
      y: height - 50,
      size: 20,
      font: font,
      color: rgb(0, 0.1, 0.3),
    });

    page.drawText(`This is a sample protected document for user: ${user.email}`, {
      x: 50,
      y: height - 100,
      size: 12,
      font: font,
    });

    // Watermark (Visible Footer)
    const watermarkText = `Licensed to: ${user.email} (ID: ${user.userId}) - DO NOT SHARE`;
    page.drawText(watermarkText, {
      x: 50,
      y: 30,
      size: 10,
      font: font,
      color: rgb(0.8, 0.1, 0.1),
    });

    // Metadata Injection (Invisible Watermark)
    pdfDoc.setTitle('One Nation Protected Document');
    pdfDoc.setAuthor('One Nation Republic');
    pdfDoc.setSubject(`Licensed to User ID ${user.userId}`);
    pdfDoc.setKeywords(['confidential', `user_${user.userId}`, 'trust_law']);

    const pdfBytes = await pdfDoc.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=protected_doc_${docId}.pdf`);
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

export default router;
