// db.js — permanent cloud database (Turso, a free hosted SQLite service)
//
// WHY THIS EXISTS
// Render's free plan gives your server a "disk" that is NOT permanent —
// every time new code is deployed (which happens whenever you push an
// update to GitHub), Render rebuilds the server from scratch and wipes
// anything that was saved to a local file. That was silently deleting
// every enquiry, review, and project each time the site was updated.
//
// Turso stores your data in the cloud instead, completely separate from
// Render, so it survives every redeploy, every restart, forever — for free.
//
// ONE-TIME SETUP (see backend/DEPLOY.md for full steps):
//   1. Sign up free at https://turso.tech
//   2. Create a database, copy its URL and an auth token
//   3. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN as environment
//      variables on Render (Environment tab, same place as the others)

const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local-dev.db',
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

// Converts a libSQL result (rows are array-like with named access) into
// plain JavaScript objects, so the rest of the app can use them normally
// (e.g. with JSON.stringify / res.json).
function toObjects(result) {
  return result.rows.map((row) => {
    const obj = {};
    result.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

async function run(sql, args = []) {
  const result = await client.execute({ sql, args });
  return {
    lastInsertRowid: result.lastInsertRowid !== undefined && result.lastInsertRowid !== null
      ? Number(result.lastInsertRowid)
      : undefined,
    changes: result.rowsAffected,
  };
}

async function all(sql, args = []) {
  const result = await client.execute({ sql, args });
  return toObjects(result);
}

async function get(sql, args = []) {
  const rows = await all(sql, args);
  return rows[0];
}

async function init() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      service TEXT,
      message TEXT,
      amount TEXT,
      source_page TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT,
      phone TEXT,
      rating INTEGER NOT NULL,
      review_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Projects added from the admin panel. Photos live on Cloudinary
  // permanently; this table just stores the title/description/category
  // and the Cloudinary image_url pointing to each photo.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { run, all, get, init };
