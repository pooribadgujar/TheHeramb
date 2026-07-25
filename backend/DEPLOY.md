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
   - `CLOUDINARY_CLOUD_NAME` → from your Cloudinary Dashboard (Step 1.5)
   - `CLOUDINARY_API_KEY` → from your Cloudinary Dashboard
   - `CLOUDINARY_API_SECRET` → from your Cloudinary Dashboard
6. Click **Create Web Service**. Wait 2–3 minutes while it builds.
7. When it's done, Render gives you a URL like:
   `https://heramb-backend.onrender.com`
   — copy this, you'll need it next.

**Note:** Render's free tier "sleeps" the server after 15 minutes of no
traffic, so the very first request after a quiet period can take ~30 seconds
to wake up. That's fine for a small business site — the form will just show
a brief loading state.

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
