# Heramb Designing & Printing — Website Guide (No Coding Needed)

Your website has 5 pages that all share one look:

| File            | Page                |
|------------------|----------------------|
| index.html       | Home                |
| profile.html     | Profile / About      |
| projects.html    | Recent Projects      |
| reviews.html     | Customer Reviews     |
| payment.html     | Payment & Enquiry    |

Two more files run the design behind the scenes — you won't need to touch these:
`styles.css` (colors/layout) and `script.js` (menu, filters, form).
The `images` folder holds your logo (already made transparent for you).

---

## 1. Put it online for FREE in 2 minutes (Netlify)

1. Go to **https://app.netlify.com/drop**
2. Drag your whole `heramb-website` folder into the box on that page.
3. Netlify gives you a live link instantly (like `heramb-design.netlify.app`).
4. To use your own domain name later (e.g. herambdesigning.com), go to
   **Site settings → Domain management → Add a custom domain** and follow the prompts.

That's it — your site is live and anyone can visit it.

---

## 2. How to edit text (no coding)

1. Open the folder, right-click the page you want to edit (e.g. `index.html`),
   and choose **Open with → Notepad** (Windows) or **TextEdit** (Mac, then
   turn off rich text: Format → Make Plain Text).
2. Use **Find** (Ctrl+F / Cmd+F) to locate the sentence you want to change.
3. Type your new text between the same `<` `>` tags — don't delete the tags themselves.
4. Save the file and refresh your browser to preview.

**Example** — to change the phone number, search for `9579480187` in every page
and replace it with your number. It appears in the footer of every page and
in the WhatsApp links (`https://wa.me/91...`).

---

## 3. Things you should personalize before going live

- [ ] **Bank details** — open `payment.html`, search for `XXXX` and replace
      with your real account number, IFSC code, and bank/branch name.
- [ ] **UPI ID** — already set to `9421990387@ybl` in `payment.html` and
      `script.js`. If it ever changes, search both files for `9421990387@ybl`
      and replace every occurrence, and also update `UPI_ID` in `backend/.env`.
- [ ] **Social media links** — search for `href="#"` next to the Instagram
      and Facebook icons (in every page's footer) and replace `#` with your
      real profile links.
- [ ] **Project photos** — the original launch set of projects is built
      into `projects.html` directly. For any **new** project going forward,
      you don't need to touch this file at all — see section 14 below,
      "Adding new projects (no coding, from admin.html)".
- [ ] **Reviews** — swap the sample names/quotes in `reviews.html` and
      `index.html` for real customer feedback whenever you have it.

---

## 4. Payment page — now live and connected to your UPI account

`payment.html` now shows a **real, scannable QR code** generated straight
from your UPI ID (`9421990387@ybl`). Anyone who scans it — or taps
**"Pay Now via UPI App"** on their phone — is taken straight to their UPI
app with your account already filled in as the payee. Money goes directly
into your bank account the normal UPI way; this site never touches or holds
the money itself.

If a customer types an amount into the box above the QR code, that amount
gets pre-filled in their UPI app too (they can still edit it before paying).

## 5. Backend — stores every customer's details for you

The "Send Us an Enquiry" form on `payment.html` now saves each submission
(name, phone, service, amount, message) into a small database, which you can
view any time at `admin.html` on your site, protected by a password only you
know.

**This needs one extra step you (or I) do once**: deploying the small
`backend` folder so it's live on the internet. See `backend/DEPLOY.md` for
step-by-step instructions (free, takes about 5 minutes on Render). After
that, you just edit one line in `config.js` to point the website at it.

Until the backend is deployed, the enquiry form will show a friendly
"couldn't reach the server" message and customers should be directed to
WhatsApp instead — nothing breaks.

---

## 6. Enquiries now also come straight to WhatsApp

Every time someone submits the enquiry form on `payment.html`, a WhatsApp
message with their name, phone, service and message opens automatically in
a new tab addressed to **+91 95794 80187** — they just need to tap Send.
The enquiry is also saved permanently in that visitor's browser as a backup,
and (if the backend is online) sent to your database too.

To change the WhatsApp number this goes to, open `config.js` and edit
`HERAMB_WHATSAPP_NUMBER`.

## 7. Admin panel now works even if the backend is asleep

`admin.html` first tries your real password against the backend. If the
backend can't be reached at all, it automatically falls back to an
**offline password** (set in `config.js` as `HERAMB_ADMIN_LOCAL_PASSWORD`,
default `heramb2026` — change this to something private) and shows whatever
enquiries were saved on that specific device/browser. Rows saved this way
show a small 📱 icon. This means data is never lost just because the free
Render backend happened to be asleep when a customer submitted the form —
closing and reopening the browser will not clear it.

## 8. Google Form for reviews

On `reviews.html`, the **"Fill Our Google Review Form"** button is already
connected to your live form at `forms.gle/a3bJWWWBiYuXPoJC6`. If you ever
create a new form, open `reviews.html`, search for `googleFormBtn`, and
swap the link in its `href="..."`.

**Getting those Google Form submissions into your admin panel + WhatsApp:**
Google Forms doesn't talk to your website on its own — it needs a small
connector script. This is already written for you at
`backend/google-form-integration.gs`. Open that file and follow the setup
steps at the top (paste it into the Apps Script editor attached to your
form, add your free CallMeBot API key, turn on the trigger). Once set up,
every Google Form submission:
- Appears in `admin.html` under Customer Reviews as **pending**, exactly
  like a review submitted on the website.
- Sends you a WhatsApp message with the review.
- Goes live on the Reviews page automatically the moment you approve it
  in `admin.html` — nothing else to do.

## 9. Average rating — now calculated live, not fixed

The "4.9★ Average Rating" on the homepage and the big rating number on
`reviews.html` start at 4.9 as a baseline. Once there's at least one real
**approved** review (from the website form or the Google Form), the site
recalculates the average and the star breakdown bars from actual review
data automatically, every time the page loads. You don't edit this by
hand — approve reviews in `admin.html` and the numbers update themselves.

## 10. Customer reviews now need your approval before going live

`reviews.html` has a full **"Write a Review"** form (star rating + text).
When a customer submits it:
1. A WhatsApp message with their full review opens to your number instantly.
2. It's saved to your admin panel under a new **Customer Reviews** section
   (below the enquiries table in `admin.html`), with status "pending".
3. It does **not** appear on the website yet.

To publish a review, open `admin.html`, scroll to **Customer Reviews**, and
change that review's status dropdown to **approved** — it will then appear
automatically in the review grid on `reviews.html` for every visitor.
Choose **rejected** (or Delete) to keep it off the site.

The "Fill Our Google Review Form" and "Message Us on WhatsApp" buttons are
still there too, as quick alternatives next to the form.

## 11. Category cards now jump straight to filtered projects

Clicking any service card on the homepage (Creative Designing, Product
Design, Quality Printing, Event and Stall Management, Other Creatives) now
takes you directly to `projects.html` with that exact category already
filtered and highlighted — no extra tap needed.

## 12. Founder photo

Your photo now appears as a circular photo on `profile.html`, next to your
name and story. The file lives at `images/founder-prashant.jpg` — replace
that file (same filename) any time you want to swap in a new photo.

## 14. Adding new projects (no coding, from admin.html)

Whenever you have a new project to show off, log in to `admin.html` and
scroll down to **Recent Projects**:

1. Choose a photo from your phone or computer.
2. Type a title (e.g. "Diwali Sweet Box Packaging") and, optionally, a
   short one- or two-line description.
3. Pick the matching category (Creative Designing, Product Design, Quality
   Printing, Event and Stall Management, or Other Creatives).
4. Tap **Add Project**.

It appears on the public `projects.html` page immediately — no file
editing, no Netlify re-upload, nothing else to do. You can also delete any
project you added this way from the same screen.

**One-time setup needed first:** photos are stored via a free image
hosting service (Cloudinary) rather than on the backend server itself,
because the free Render plan doesn't keep files permanently. See
`backend/DEPLOY.md` → "Free image hosting for project photos (Cloudinary)"
for the one-time, ~2-minute setup (sign up free, paste 3 values into
Render). Until that's done, the Add Project form will show an error saying
image hosting isn't configured yet — everything else on the site keeps
working normally in the meantime.

## 13. Need changes later?

Just come back and tell me what you'd like adjusted (new colors, new
sections, real project photos added, the enquiry form connected to email,
etc.) — I can update the files for you any time.
