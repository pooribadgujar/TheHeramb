# Putting your backend online (free, ~5 minutes)

Your website's payment/enquiry form needs somewhere to save customer details.
That "somewhere" is this `backend` folder. It needs to run on a server that's
online all the time — not on your own laptop. **Render** offers this for free.

You will end up with a private admin address like:
`https://your-site-name.netlify.app/admin.html`
that only you can log into with a password.

---

## Step 1 — Put your code on GitHub

1. Go to **https://github.com** and create a free account if you don't have one.
2. Create a new repository (e.g. `heramb-website`), and upload your whole
   `heramb-website` folder (which includes this `backend` folder inside it).
   You can drag-and-drop files directly on the GitHub website — no command
   line needed.

> **Already deployed?** If your backend is already live (e.g. at
> `theherambackend.onrender.com`), you don't need to redo Steps 1–2 — just
> do Step 1.5 below, then go straight to your existing service on
> **render.com → your backend service → Environment**, add the three
> `CLOUDINARY_...` variables, and click **Save Changes**. Render will
> automatically redeploy with the new settings in about a minute.

## Step 1.4 — Permanent database (Turso) — IMPORTANT, do this even if already deployed

Without this step, **every enquiry, review, and project gets permanently
deleted** each time your backend redeploys (which happens every time you
upload updated code to GitHub). Turso is a free cloud database that keeps
your data safe forever, completely separate from Render.

1. Go to **https://turso.tech** and sign up free (GitHub sign-in is easiest).
2. Once logged in, click **Create Database** (name it anything, e.g. `heramb`).
3. Once created, you'll see a **Database URL** — starts with `libsql://` —
   copy it.
4. Click **Create Token** (or similar — generates an auth token), copy that too.
5. Keep both values handy — you'll paste them into Render in Step 2 as
   `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.

## Step 1.5 — Free image hosting for project photos (Cloudinary)

The "Add Project" form in `admin.html` needs somewhere permanent to store
photos. Render's free tier wipes any files saved directly on it whenever the
server restarts (which happens often on the free plan), so photos are
instead sent to **Cloudinary**, a free image hosting service. You only set
this up once.

1. Go to **https://cloudinary.com** and sign up for a free account.
2. Once logged in, you'll land on your **Dashboard** — it shows three values
   right at the top: **Cloud Name**, **API Key**, and **API Secret**.
3. Keep this tab open — you'll paste these three values into Render in the
   next step.

## Step 1.6 — Instant WhatsApp notifications (Twilio WhatsApp Sandbox)

This makes the server itself message you on WhatsApp the instant someone
submits an enquiry or review. Uses Twilio (a real, established company) —
more reliable than free hobby bots, which get overloaded/congested.

1. Go to **https://www.twilio.com/try-twilio** and sign up free (no credit
   card needed to start).
2. Once logged in, you'll land on the **Console Dashboard** — copy your
   **Account SID** and **Auth Token** shown there (click "show" to reveal
   the token).
3. In the left menu, find **Messaging → Try it out → Send a WhatsApp message**
   (sometimes under "Develop → Messaging → Try it out"). This shows you a
   **join code**, e.g. `join happy-tiger`.
4. On your own phone, open WhatsApp and send that exact join phrase to
   **+1 415 523 8886** (Twilio's shared sandbox number).
5. You'll get a reply confirming you're connected to the sandbox.
6. You'll paste your **Account SID**, **Auth Token**, and your own WhatsApp
   number into Render in Step 2 below.

**Note:** Twilio's free sandbox may ask you to resend the join message every
few days to stay connected — a small trade-off for a free, reliable option.
If you outgrow this later, Twilio (or an Indian provider like Wati or
AiSensy) offers a proper always-on WhatsApp Business number for a small
monthly fee.

## Step 2 — Deploy the backend on Render

1. Go to **https://render.com** and sign up (free) — you can sign up directly
   with your GitHub account, which makes step 3 easier.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository from Step 1.
4. When asked to configure the service:
   - **Root Directory:** `backend`  *(important — tells Render to only run the backend folder)*
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Under **Environment Variables**, add these (click "Add Environment Variable" for each):
   - `ADMIN_PASSWORD` → choose a strong password only you know
   - `SESSION_SECRET` → any long random string (mash your keyboard, 30+ characters)
   - `UPI_ID` → `9421990387@ybl`
   - `NODE_ENV` → `production`
   - `TURSO_DATABASE_URL` → from Step 1.4
   - `TURSO_AUTH_TOKEN` → from Step 1.4
   - `TWILIO_ACCOUNT_SID` → from Step 1.6
   - `TWILIO_AUTH_TOKEN` → from Step 1.6
   - `WHATSAPP_NUMBER` → your number, e.g. `919579480187`
   - `CLOUDINARY_CLOUD_NAME` → from Step 1.5
   - `CLOUDINARY_API_KEY` → from Step 1.5
   - `CLOUDINARY_API_SECRET` → from Step 1.5
6. Click **Create Web Service**. Wait 2–3 minutes while it builds.
7. When it's done, Render gives you a URL like:
   `https://heramb-backend.onrender.com`
   — copy this, you'll need it next.

**If you already have a Render service running:** just go to **your service
→ Environment**, add whichever of the variables above are missing (at least
`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `TWILIO_ACCOUNT_SID`,
`TWILIO_AUTH_TOKEN`, `WHATSAPP_NUMBER`), and click **Save Changes** — Render
redeploys automatically in about a minute.

**Note:** Render's free tier "sleeps" the server after 15 minutes of no
traffic, so the very first request after a quiet period can take ~30 seconds
to wake up. That's fine for a small business site — the form will just show
a brief loading state. This no longer affects your saved data either way,
since it now lives permanently in Turso, not on Render itself.

## Step 3 — Point your website at the backend

1. Open `heramb-website/config.js` in your website folder.
2. Replace the URL inside the quotes with the Render URL from Step 2, e.g.:
   ```js
   window.HERAMB_API_BASE = "https://heramb-backend.onrender.com";
   ```
3. Re-upload/redeploy your website files (same drag-and-drop Netlify step
   from the main guide) so the updated `config.js` goes live.

## Step 4 — Log in to your admin panel

1. Visit `https://your-website-address/admin.html`
2. Enter the `ADMIN_PASSWORD` you chose in Step 2.
3. You'll see every customer enquiry: name, phone, service, amount, message,
   date, and a status you can update (new / contacted / paid / completed / spam).

Keep the `admin.html` address and password private — don't link to it from
your public menu.

---

## Running it on your own computer first (optional, to test)

```bash
cd backend
npm install
cp .env.example .env
# open .env and set your own ADMIN_PASSWORD
npm start
```

The server starts at `http://localhost:4000`. Leave `config.js` set to
`http://localhost:4000` while testing locally, then switch it to your Render
URL before going live (Step 3 above).
