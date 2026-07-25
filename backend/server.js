// server.js — Heramb Designing & Printing backend
//
// What this does:
//   1. Accepts customer enquiry/order submissions from the website and saves
//      them into a local SQLite database (data/heramb.db).
//   2. Provides a password-protected admin API so you can view every
//      submission (used by admin.html).
//
// How to run locally:
//   1. cd backend
//   2. npm install
//   3. cp .env.example .env      (then edit .env and set your own ADMIN_PASSWORD)
//   4. npm start
//   Server runs at http://localhost:4000 by default.
//
// See DEPLOY.md for how to put this online for free (Render/Railway).

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

// --- Cloudinary (free image hosting) -----------------------------------
// Project photos are uploaded here instead of being saved on this server's
// own disk, because Render's free tier wipes local files whenever the
// server restarts/redeploys. Cloudinary keeps them permanently for free.
// Needs three environment variables set (see .env.example / DEPLOY.md).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Accepts the uploaded photo into memory (never written to disk here),
// then streamed straight to Cloudinary. 8MB cap is generous for a phone photo.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed.'));
    cb(null, true);
  },
});

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'heramb-projects', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

app.use(express.json());
app.use(cookieParser());

// --- CORS -------------------------------------------------------------
// Allows your website (wherever it's hosted) to talk to this backend.
// If ALLOWED_ORIGIN is left blank, all origins are allowed (fine while testing).
app.use(cors({
  origin: ALLOWED_ORIGIN ? ALLOWED_ORIGIN.split(',').map(s => s.trim()) : true,
  credentials: true,
}));

// --- Simple in-memory session store ------------------------------------
// Good enough for a single-admin site. Sessions live until the server restarts.
const sessions = new Map(); // token -> expiry timestamp
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  return token;
}

function isValidSession(token) {
  if (!token) return false;
  const expiry = sessions.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function requireAdmin(req, res, next) {
  const token = req.cookies.session;
  if (!isValidSession(token)) {
    return res.status(401).json({ error: 'Not logged in.' });
  }
  next();
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// --- Rate limiting (basic anti-spam / anti-brute-force) -----------------
const enquiryLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 }); // 20 submissions / 10 min / IP
const loginLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10 });   // 10 login attempts / 10 min / IP

// ======================= PUBLIC ROUTES =======================

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Returns the UPI ID to pay to (kept server-side so it's easy to change in one place)
app.get('/api/upi-id', (req, res) => {
  res.json({ upiId: process.env.UPI_ID || '9421990387@ybl', payeeName: 'Heramb Designing & Printing' });
});

// Customer submits their details (name, phone, service, message, amount)
app.post('/api/enquiries', enquiryLimiter, (req, res) => {
  const { name, phone, service, message, amount, sourcePage } = req.body || {};

  if (!name || !String(name).trim() || !phone || !String(phone).trim()) {
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }

  const stmt = db.prepare(`
    INSERT INTO enquiries (name, phone, service, message, amount, source_page)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    String(name).trim().slice(0, 200),
    String(phone).trim().slice(0, 50),
    service ? String(service).trim().slice(0, 100) : null,
    message ? String(message).trim().slice(0, 2000) : null,
    amount ? String(amount).trim().slice(0, 50) : null,
    sourcePage ? String(sourcePage).trim().slice(0, 100) : null
  );

  res.json({ ok: true, id: info.lastInsertRowid });
});

// Customer submits a star rating + review text — saved as "pending" until
// the owner approves it in admin.html; only approved reviews are public.
app.post('/api/reviews', enquiryLimiter, (req, res) => {
  const { name, role, phone, rating, reviewText } = req.body || {};

  const ratingNum = parseInt(rating, 10);
  if (!name || !String(name).trim() || !reviewText || !String(reviewText).trim() ||
      !ratingNum || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Name, a 1-5 star rating and a review are required.' });
  }

  const stmt = db.prepare(`
    INSERT INTO reviews (name, role, phone, rating, review_text)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    String(name).trim().slice(0, 200),
    role ? String(role).trim().slice(0, 100) : null,
    phone ? String(phone).trim().slice(0, 50) : null,
    ratingNum,
    String(reviewText).trim().slice(0, 2000)
  );

  res.json({ ok: true, id: info.lastInsertRowid });
});

// Public: only approved reviews, for display on reviews.html
app.get('/api/reviews/approved', (req, res) => {
  const rows = db.prepare("SELECT id, name, role, rating, review_text, created_at FROM reviews WHERE status = 'approved' ORDER BY id DESC").all();
  res.json({ reviews: rows });
});

// Public: every project added from the admin panel, for display on projects.html
app.get('/api/projects', (req, res) => {
  const rows = db.prepare('SELECT id, title, description, category, image_url, created_at FROM projects ORDER BY id DESC').all();
  res.json({ projects: rows });
});

// ======================= ADMIN ROUTES =======================

app.get('/api/admin/reviews', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM reviews ORDER BY id DESC').all();
  res.json({ reviews: rows });
});

app.patch('/api/admin/reviews/:id', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['pending', 'approved', 'rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/reviews/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { password } = req.body || {};
  if (!password || !timingSafeEqual(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  const token = createSession();
  res.cookie('session', token, {
    httpOnly: true,
    sameSite: 'none', // required because the website and backend live on different domains
    secure: true,      // required whenever sameSite is 'none' — Render always serves over https, so this is safe
    maxAge: SESSION_TTL_MS,
  });
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  const token = req.cookies.session;
  if (token) sessions.delete(token);
  res.clearCookie('session');
  res.json({ ok: true });
});

app.get('/api/admin/check', (req, res) => {
  res.json({ loggedIn: isValidSession(req.cookies.session) });
});

app.get('/api/admin/enquiries', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM enquiries ORDER BY id DESC').all();
  res.json({ enquiries: rows });
});

app.patch('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['new', 'contacted', 'paid', 'completed', 'spam'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  db.prepare('UPDATE enquiries SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM enquiries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Admin adds a new project: photo + title + description + category.
// multipart/form-data, field name for the photo must be "photo".
app.post('/api/admin/projects', requireAdmin, (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed.' });

    const { title, description, category } = req.body || {};
    const allowedCategories = ['branding', 'packaging', 'print', 'photography', 'design'];

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ error: 'A valid category is required.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'A photo is required.' });
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ error: 'Image hosting is not configured yet (missing Cloudinary settings on the server).' });
    }

    try {
      const result = await uploadToCloudinary(req.file.buffer);
      const stmt = db.prepare(`
        INSERT INTO projects (title, description, category, image_url)
        VALUES (?, ?, ?, ?)
      `);
      const info = stmt.run(
        String(title).trim().slice(0, 200),
        description ? String(description).trim().slice(0, 500) : null,
        category,
        result.secure_url
      );
      res.json({ ok: true, id: info.lastInsertRowid, image_url: result.secure_url });
    } catch (e) {
      console.error('Cloudinary upload failed:', e);
      res.status(500).json({ error: 'Photo upload failed. Please try again.' });
    }
  });
});

app.delete('/api/admin/projects/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Heramb backend running on http://localhost:${PORT}`);
  console.log(`Admin password is set from .env — do not share it.`);
});
