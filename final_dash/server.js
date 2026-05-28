const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-super-secret-key-change-this';

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// 1. Initialize SQLite database file
const dbPath = path.resolve(__dirname, 'reel_runner.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('Database connection failed:', err);
  console.log('Connected to SQLite Database at:', dbPath);
});

// 2. Create tables if they do not exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      balance REAL DEFAULT 5000.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reels (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      topic TEXT NOT NULL,
      duration INTEGER NOT NULL,
      cost REAL NOT NULL,
      download_url TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

// Middleware to authenticate JWT tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// ================= AUTHENTICATION APIS =================

// User Registration Route
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (email, password_hash) VALUES (?, ?)`,
      [email, passwordHash],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Login Route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Incorrect email or password' });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(400).json({ error: 'Incorrect email or password' });

    // Sign JWT Token containing User ID and Email
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance
      }
    });
  });
});

// ================= REELS LOG APIS =================

// Get Reel History for Authenticated User
app.get('/api/reels', authenticateToken, (req, res) => {
  db.all(
    `SELECT * FROM reels WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Save Generated Reel Log & Deduct Balance
app.post('/api/reels/log', authenticateToken, (req, res) => {
  const { jobId, topic, duration, cost, downloadUrl } = req.body;
  if (!jobId || !topic || !duration || !cost || !downloadUrl) {
    return res.status(400).json({ error: 'Missing log parameters' });
  }

  db.serialize(() => {
    // Check wallet balance
    db.get(`SELECT balance FROM users WHERE id = ?`, [req.user.id], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (user.balance < cost) return res.status(400).json({ error: 'Insufficient balance' });

      // Deduct balance
      db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [cost, req.user.id]);

      // Save Reel record
      db.run(
        `INSERT INTO reels (id, user_id, topic, duration, cost, download_url) VALUES (?, ?, ?, ?, ?, ?)`,
        [jobId, req.user.id, topic, duration, cost, downloadUrl],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Reel logged and balance updated successfully', jobId });
        }
      );
    });
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Reel Runner Backend listening at http://localhost:${PORT}`);
});