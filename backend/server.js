// server.js — Heramb Designing & Printing backend
//
// What this does:
//   1. Accepts customer enquiry/order submissions from the website and saves
//      them permanently in a free cloud database (Turso — see db.js).
//   2. Instantly notifies the owner on WhatsApp the moment someone submits
//      an enquiry or review (via CallMeBot — see setup in DEPLOY.md).
//   3. Provides a password-protected admin API so you can view every
//      submission (used by admin.html).
//
// How to run locally:
//   1. cd backend
//   2. npm install
//   3. cp .env.example .env      (then edit .env and set your own values)
//   4. npm start
//   Server runs at http://localhost:4000 by default.
//
// See DEPLOY.md for how to put this online for free (Render) and set up
// the permanent database + instant WhatsApp notifications.

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

// --- Cloudinary (free image hosting) -----------------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

// --- Instant WhatsApp notifications (Twilio WhatsApp Sandbox, free) -----
// Runs the moment an enquiry or review is submitted — no customer action
// needed. Uses Twilio instead of free hobby bots (which get overloaded/
// congested) — Twilio is an established company, so this is reliable.
// Needs TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + WHATSAPP_NUMBER set as
// environment variables (see DEPLOY.md for the 5-minute setup). Silently
// does nothing if not configured yet, so the site still works fine
// without it.
function notifyWhatsApp(message) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const toNumber = process.env.WHATSAPP_NUMBER;
  if (!sid || !token || !toNumber) return;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const body = new URLSearchParams({
    From: 'whatsapp:+14155238886', // Twilio's shared sandbox number
    To: 'whatsapp:+' + toNumber,
    Body: message,
  });
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  }).catch((err) => console.error('WhatsApp (Twilio) notification failed:', err));
}

const compression = require('compression');
app.use(compression()); // gzip API responses — cheap win under concurrent load

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: ALLOWED_ORIGIN ? ALLOWED_ORIGIN.split(',').map(s => s.trim()) : true,
  credentials: true,
}));

// --- Simple in-memory session store ------------------------------------
const sessions = new Map();
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

// Strips spaces/dashes/+/country code from any phone number so it's always
// stored as a plain 10-digit number, regardless of whether it came from the
// website form (already 10 digits) or the Google Form (which may include
// +91, spaces, or dashes).
// Exact current time in IST (Indian Standard Time), formatted for display
// in the admin panel — e.g. "27 Jul 2026, 6:42:15 pm". The database's own
// datetime('now') defaults to UTC, which is why timestamps looked off.
function nowIST() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true,
  }).replace(',', '');
}

function normalizePhone(raw) {
  if (!raw) return null;
  var digits = String(raw).replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(-10); // drop leading country code
  return digits || null;
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

const enquiryLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });
const loginLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 10 });

// ======================= PUBLIC ROUTES =======================

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/upi-id', (req, res) => {
  res.json({ upiId: process.env.UPI_ID || '9421990387@ybl', payeeName: 'Heramb Designing & Printing' });
});

// Customer submits their details (name, phone, service, message, amount)
app.post('/api/enquiries', enquiryLimiter, async (req, res) => {
  try {
    const { name, phone, service, message, amount, sourcePage } = req.body || {};

    if (!name || !String(name).trim() || !phone || !String(phone).trim()) {
      return res.status(400).json({ error: 'Name and phone number are required.' });
    }

    const cleanName = String(name).trim().slice(0, 200);
    const cleanPhone = normalizePhone(phone) || String(phone).trim().slice(0, 50);
    const cleanService = service ? String(service).trim().slice(0, 100) : null;
    const cleanMessage = message ? String(message).trim().slice(0, 2000) : null;
    const cleanAmount = amount ? String(amount).trim().slice(0, 50) : null;
    const cleanSourcePage = sourcePage ? String(sourcePage).trim().slice(0, 100) : null;

    const info = await db.run(
      `INSERT INTO enquiries (name, phone, service, message, amount, source_page, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cleanName, cleanPhone, cleanService, cleanMessage, cleanAmount, cleanSourcePage, nowIST()]
    );

    notifyWhatsApp(
      'New enquiry from the website:\n' +
      'Name: ' + cleanName + '\n' +
      'Phone: ' + cleanPhone + '\n' +
      (cleanService ? ('Service: ' + cleanService + '\n') : '') +
      (cleanAmount ? ('Amount: ₹' + cleanAmount + '\n') : '') +
      (cleanMessage ? ('Message: ' + cleanMessage + '\n') : '') +
      'Check admin panel for full details.'
    );

    res.json({ ok: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error('Error saving enquiry:', err);
    res.status(500).json({ error: 'Could not save enquiry right now.' });
  }
});

// Customer submits a star rating + review text — saved as "pending" until
// the owner approves it in admin.html; only approved reviews are public.
app.post('/api/reviews', enquiryLimiter, async (req, res) => {
  try {
    const { name, role, phone, rating, reviewText } = req.body || {};

    const ratingNum = parseInt(rating, 10);
    if (!name || !String(name).trim() || !reviewText || !String(reviewText).trim() ||
        !ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Name, a 1-5 star rating and a review are required.' });
    }

    const cleanName = String(name).trim().slice(0, 200);
    const cleanRole = role ? String(role).trim().slice(0, 100) : null;
    const cleanPhone = normalizePhone(phone);
    const cleanText = String(reviewText).trim().slice(0, 2000);

    const info = await db.run(
      `INSERT INTO reviews (name, role, phone, rating, review_text, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [cleanName, cleanRole, cleanPhone, ratingNum, cleanText, nowIST()]
    );

    const stars = '★★★★★'.slice(0, ratingNum) + '☆☆☆☆☆'.slice(0, 5 - ratingNum);
    notifyWhatsApp(
      'New customer review submitted:\n' +
      'Name: ' + cleanName + (cleanRole ? (' (' + cleanRole + ')') : '') + '\n' +
      'Rating: ' + stars + ' (' + ratingNum + '/5)\n' +
      'Review: ' + cleanText + '\n' +
      (cleanPhone ? ('Phone: ' + cleanPhone + '\n') : '') +
      'Approve it in the admin panel to publish it on the Reviews page.'
    );

    res.json({ ok: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error('Error saving review:', err);
    res.status(500).json({ error: 'Could not save review right now.' });
  }
});

// Public: only approved reviews, for display on reviews.html
app.get('/api/reviews/approved', async (req, res) => {
  try {
    const rows = await db.all(
      "SELECT id, name, role, rating, review_text, created_at FROM reviews WHERE status = 'approved' ORDER BY id DESC"
    );
    res.json({ reviews: rows });
  } catch (err) {
    console.error('Error loading approved reviews:', err);
    res.status(500).json({ reviews: [] });
  }
});

// Public: every project added from the admin panel, for display on projects.html
app.get('/api/projects', async (req, res) => {
  try {
    const rows = await db.all(
      'SELECT id, title, description, category, image_url, created_at FROM projects ORDER BY id DESC'
    );
    res.json({ projects: rows });
  } catch (err) {
    console.error('Error loading projects:', err);
    res.status(500).json({ projects: [] });
  }
});

// ======================= ADMIN ROUTES =======================

app.get('/api/admin/reviews', requireAdmin, async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM reviews ORDER BY id DESC');
    res.json({ reviews: rows });
  } catch (err) {
    console.error('Error loading reviews:', err);
    res.status(500).json({ reviews: [] });
  }
});

app.patch('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = ['pending', 'approved', 'rejected'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    await db.run('UPDATE reviews SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error updating review:', err);
    res.status(500).json({ error: 'Could not update review.' });
  }
});

app.delete('/api/admin/reviews/:id', requireAdmin, async (req, res) => {
  try {
    await db.run('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Could not delete review.' });
  }
});

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { password } = req.body || {};
  if (!password || !timingSafeEqual(password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Incorrect password.' });
  }
  const token = createSession();
  res.cookie('session', token, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
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

app.get('/api/admin/enquiries', requireAdmin, async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM enquiries ORDER BY id DESC');
    res.json({ enquiries: rows });
  } catch (err) {
    console.error('Error loading enquiries:', err);
    res.status(500).json({ enquiries: [] });
  }
});

app.patch('/api/admin/enquiries/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body || {};
    const allowed = ['new', 'contacted', 'paid', 'completed', 'spam'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    await db.run('UPDATE enquiries SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error updating enquiry:', err);
    res.status(500).json({ error: 'Could not update enquiry.' });
  }
});

app.delete('/api/admin/enquiries/:id', requireAdmin, async (req, res) => {
  try {
    await db.run('DELETE FROM enquiries WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting enquiry:', err);
    res.status(500).json({ error: 'Could not delete enquiry.' });
  }
});

// Admin adds a new project: photo + title + description + category.
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
      const info = await db.run(
        `INSERT INTO projects (title, description, category, image_url, created_at) VALUES (?, ?, ?, ?, ?)`,
        [
          String(title).trim().slice(0, 200),
          description ? String(description).trim().slice(0, 500) : null,
          category,
          result.secure_url,
          nowIST(),
        ]
      );
      res.json({ ok: true, id: info.lastInsertRowid, image_url: result.secure_url });
    } catch (e) {
      console.error('Cloudinary upload / save failed:', e);
      res.status(500).json({ error: 'Photo upload failed. Please try again.' });
    }
  });
});

app.delete('/api/admin/projects/:id', requireAdmin, async (req, res) => {
  try {
    await db.run('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Could not delete project.' });
  }
});

// Make sure the database tables exist, THEN start accepting requests.
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Heramb backend running on http://localhost:${PORT}`);
      console.log(`Admin password is set from .env — do not share it.`);
    });
  })
  .catch((err) => {
    console.error('Could not set up the database — check TURSO_DATABASE_URL / TURSO_AUTH_TOKEN:', err);
    process.exit(1);
  });
