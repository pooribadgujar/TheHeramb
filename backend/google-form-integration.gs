// google-form-integration.gs
//
// WHAT THIS DOES
// Every time someone submits your Google Review Form, this script:
//   1. Sends their answers to your backend, so the review shows up in
//      admin.html exactly like a review submitted on the website — as
//      "pending" until you approve it, then it publishes automatically.
//   2. Sends you a WhatsApp message with the review, via a free service
//      called CallMeBot (setup steps below — takes about 2 minutes).
//
// This does NOT run on your website. It runs on Google's servers,
// attached to your Google Form. You never have to keep a browser open
// for this to work.
//
// ============================= SETUP =====================================
//
// STEP 1 — Open the script editor attached to your form
//   1. Open your Google Form (the one at forms.gle/a3bJWWWBiYuXPoJC6).
//   2. Click the 3-dot menu (top right) → "Script editor" (Apps Script opens).
//   3. Delete anything in the default Code.gs file.
//   4. Paste this entire file's contents in its place.
//
// STEP 2 — Fill in the 3 blanks below
//   - BACKEND_URL is already set to your Render backend. If you ever
//     redeploy the backend elsewhere, update it here too (must match
//     config.js on the website).
//   - WHATSAPP_NUMBER: your own number, country code + number, no + or
//     spaces (already filled in with the number from config.js).
//   - CALLMEBOT_API_KEY: get this by:
//       a) Save +34 644 59 71 12 as a contact in your phone
//          (this is CallMeBot's official number, a free WhatsApp bot).
//       b) WhatsApp that contact the exact message:
//          "I allow callmebot to send me messages"
//       c) Within a minute you'll get a reply back with your personal
//          API key (a number). Paste it below.
//     CallMeBot is a free third-party service, not run by WhatsApp or
//     Google — it has a small daily message limit, which is plenty for
//     a review notification a day.
//
// STEP 3 — Turn the script on
//   1. In the Apps Script editor, click the clock icon on the left
//      ("Triggers").
//   2. Click "+ Add Trigger" (bottom right).
//   3. Set: Function = onFormSubmit | Event source = From form |
//      Event type = On form submit → Save.
//   4. Google will ask you to authorize the script — click through and
//      allow it (it's your own script acting on your own form/backend).
//
// That's it. Submit a test response to your form and you should see it
// in admin.html within a few seconds, and get a WhatsApp message.
//
// ===========================================================================

var BACKEND_URL = 'https://theherambackend.onrender.com/api/reviews';
var WHATSAPP_NUMBER = '919579480187';
var CALLMEBOT_API_KEY = 'PASTE_YOUR_CALLMEBOT_API_KEY_HERE';

function onFormSubmit(e) {
  var itemResponses = e.response.getItemResponses();
  var data = {};

  itemResponses.forEach(function (item) {
    var title = item.getItem().getTitle().toLowerCase();
    var answer = item.getResponse();

    if (title.indexOf('name') !== -1) {
      data.name = answer;
    } else if (title.indexOf('phone') !== -1) {
      data.phone = answer;
    } else if (title.indexOf('overall') !== -1 || (title.indexOf('rating') !== -1 && !data.rating)) {
      data.rating = answer;
    } else if (title.indexOf('service') !== -1 || title.indexOf('role') !== -1) {
      data.role = answer;
    } else if (title.indexOf('review') !== -1) {
      data.reviewText = data.reviewText ? (data.reviewText + ' ' + answer) : answer;
    } else if (title.indexOf('recommend') !== -1) {
      data.reviewText = (data.reviewText ? data.reviewText + ' ' : '') + 'Would recommend: ' + answer + '.';
    }
  });

  var payload = {
    name: data.name || 'Anonymous',
    role: data.role || 'Customer',
    phone: data.phone || '',
    rating: data.rating || 5,
    reviewText: data.reviewText || '(No written review provided)'
  };

  // 1) Send to backend so it appears in admin.html as a pending review
  try {
    UrlFetchApp.fetch(BACKEND_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log('Error sending to backend: ' + err);
  }

  // 2) Send a WhatsApp notification via CallMeBot
  if (CALLMEBOT_API_KEY && CALLMEBOT_API_KEY !== 'PASTE_YOUR_CALLMEBOT_API_KEY_HERE') {
    var message = 'New Google Form review:\n' +
      'Name: ' + payload.name + '\n' +
      'Rating: ' + payload.rating + '/5\n' +
      'Review: ' + payload.reviewText + '\n' +
      (payload.phone ? ('Phone: ' + payload.phone + '\n') : '') +
      '\nApprove it in your admin panel to publish it on the Reviews page.';

    var url = 'https://api.callmebot.com/whatsapp.php?phone=' + WHATSAPP_NUMBER +
      '&text=' + encodeURIComponent(message) + '&apikey=' + CALLMEBOT_API_KEY;

    try {
      UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    } catch (err) {
      Logger.log('Error sending WhatsApp notification: ' + err);
    }
  }
}
