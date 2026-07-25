// config.js — one setting you need to edit.
//
// This points your website at your live backend on Render.
// If you ever redeploy the backend somewhere else, update the URL below
// (no trailing slash).
//
// While testing on your own computer with the backend running locally,
// change this back to "http://localhost:4000".

window.HERAMB_API_BASE = "https://theheramb.onrender.com";

// Every enquiry submitted on payment.html also opens a pre-filled WhatsApp
// message to this number, so you get it instantly even if the backend
// above is asleep/unreachable. Change the number here if it ever changes
// (country code + number, no + or spaces).
window.HERAMB_WHATSAPP_NUMBER = "919579480187";

// Fallback admin password used ONLY when admin.html cannot reach the
// backend at all (e.g. it's asleep or not deployed yet). It unlocks a
// local, device-only view of enquiries saved in this browser's storage.
// Change this to something only you know, and keep it private.
window.HERAMB_ADMIN_LOCAL_PASSWORD = "heramb2026";
