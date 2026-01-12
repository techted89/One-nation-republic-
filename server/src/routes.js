"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_js_1 = __importDefault(require("./db.js"));
const router = (0, express_1.Router)();
const JWT_SECRET = 'super-secret-key-change-this-in-prod'; // In prod use env var
// --- Auth Routes ---
// Validate License Key
router.post('/validate-license', (req, res) => {
    const { licenseKey } = req.body;
    if (!licenseKey)
        return res.status(400).json({ error: 'License key required' });
    const stmt = db_js_1.default.prepare('SELECT * FROM license_keys WHERE key = ?');
    const key = stmt.get(licenseKey);
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
    const keyStmt = db_js_1.default.prepare('SELECT * FROM license_keys WHERE key = ?');
    const key = keyStmt.get(licenseKey);
    if (!key || key.status !== 'active') {
        return res.status(400).json({ error: 'Invalid or used license key' });
    }
    // 2. Check if email exists
    const userStmt = db_js_1.default.prepare('SELECT * FROM users WHERE email = ?');
    const existingUser = userStmt.get(email);
    if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
    }
    // 3. Create User & Update License & Add Device (Transaction)
    const registerTx = db_js_1.default.transaction(() => {
        const hashedPassword = bcryptjs_1.default.hashSync(password, 10);
        const insertUser = db_js_1.default.prepare('INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)');
        const result = insertUser.run(email, hashedPassword, fullName);
        const userId = result.lastInsertRowid;
        const updateLicense = db_js_1.default.prepare('UPDATE license_keys SET status = ?, user_id = ? WHERE id = ?');
        updateLicense.run('used', userId, key.id);
        const insertDevice = db_js_1.default.prepare('INSERT INTO user_devices (user_id, device_hash, user_agent) VALUES (?, ?, ?)');
        insertDevice.run(userId, deviceHash, userAgent || '');
        return userId;
    });
    try {
        const userId = registerTx();
        // Generate Token
        const token = jsonwebtoken_1.default.sign({ userId, email }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('token', token, { httpOnly: true, secure: false }); // secure: true in prod
        res.json({ success: true, user: { id: userId, email, fullName } });
    }
    catch (err) {
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
    const userStmt = db_js_1.default.prepare('SELECT * FROM users WHERE email = ?');
    const user = userStmt.get(email);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const validPassword = bcryptjs_1.default.compareSync(password, user.password_hash);
    if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Device Locking Logic
    const devicesStmt = db_js_1.default.prepare('SELECT * FROM user_devices WHERE user_id = ?');
    const devices = devicesStmt.all(user.id);
    const knownDevice = devices.find(d => d.device_hash === deviceHash);
    if (!knownDevice) {
        if (devices.length >= 2) {
            return res.status(403).json({ error: 'Device limit reached (Max 2). Contact support to reset.' });
        }
        else {
            // Add new device
            const insertDevice = db_js_1.default.prepare('INSERT INTO user_devices (user_id, device_hash, user_agent) VALUES (?, ?, ?)');
            insertDevice.run(user.id, deviceHash, userAgent || '');
        }
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true, secure: false });
    res.json({ success: true, user: { id: user.id, email: user.email, fullName: user.full_name } });
});
// Middleware for Protected Routes
const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
router.get('/me', authenticate, (req, res) => {
    const userStmt = db_js_1.default.prepare('SELECT id, email, full_name FROM users WHERE id = ?');
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
exports.default = router;
//# sourceMappingURL=routes.js.map