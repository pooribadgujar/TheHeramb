// ============ HERAMB DESIGNING & PRINTING — shared script ============

// Floating WhatsApp button — appears on every page, always ready for a chat
document.addEventListener('DOMContentLoaded', function () {
  var waBtn = document.createElement('a');
  waBtn.href = 'https://wa.me/919579480187?text=' + encodeURIComponent("Hi, I'd like to enquire about your services.");
  waBtn.target = '_blank';
  waBtn.rel = 'noopener';
  waBtn.setAttribute('aria-label', 'Chat with us on WhatsApp');
  waBtn.className = 'floating-whatsapp-btn';
  waBtn.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>';
  document.body.appendChild(waBtn);
});

// Logo shine: on click/tap, play the full sweep once even after the
// finger/mouse lifts (mobile has no :hover, and a quick tap is shorter
// than the animation, so CSS :active alone can miss it on phones).
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.logo-frame, .brand').forEach(function (el) {
    el.addEventListener('click', function () {
      el.classList.remove('shine-play');
      void el.offsetWidth; // restart animation if clicked again quickly
      el.classList.add('shine-play');
    });
    el.addEventListener('animationend', function () {
      el.classList.remove('shine-play');
    });
  });
});

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    // close menu when a link is tapped
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // ---------- Wrap review stars so each star can pop individually ----------
  document.querySelectorAll('.review-stars').forEach(function (el) {
    var txt = el.textContent.trim();
    el.innerHTML = txt.split('').map(function (ch) { return '<span>' + ch + '</span>'; }).join('');
  });

  // ---------- Animated counting numbers (e.g. 1000+, 27+) ----------
  var counters = document.querySelectorAll('.stat-num');
  function animateCounter(el) {
    var raw = el.textContent.trim();
    var match = raw.match(/^([\d.]+)(.*)$/);
    if (!match) return;
    var end = parseFloat(match[1]);
    var suffix = match[2] || '';
    if (isNaN(end)) return;
    var duration = 1200;
    var start = performance.now();
    el.classList.add('counting');
    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(end * eased);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = raw;
    }
    requestAnimationFrame(tick);
  }
  if (counters.length && 'IntersectionObserver' in window) {
    var counterIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { counterIo.observe(c); });
  }

  // ---------- Animated rating bars on Reviews page ----------
  var bars = document.querySelectorAll('.bar-fill');
  if (bars.length && 'IntersectionObserver' in window) {
    var barIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var target = entry.target;
          var w = target.style.width;
          target.style.width = '0%';
          requestAnimationFrame(function () {
            setTimeout(function () { target.style.width = w; }, 60);
          });
          barIo.unobserve(target);
        }
      });
    }, { threshold: 0.4 });
    bars.forEach(function (b) { barIo.observe(b); });
  }

  // ---------- Cursor-follow spotlight on panels/cards ----------
  document.querySelectorAll('.panel, .pay-card').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      el.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    });
  });

  // ---------- Confetti micro-burst (used on form submit) ----------
  function fireConfetti(originEl) {
    var colors = ['#e05e0e', '#ecb400', '#0e9c8f', '#ef5f6d', '#8b5cf6'];
    var rect = originEl ? originEl.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2, width:0, height:0 };
    var originX = rect.left + rect.width/2;
    var originY = rect.top + rect.height/2;
    for (var i = 0; i < 26; i++) {
      var piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.background = colors[i % colors.length];
      piece.style.left = originX + 'px';
      piece.style.top = originY + 'px';
      document.body.appendChild(piece);
      var angle = Math.random() * Math.PI * 2;
      var distance = 80 + Math.random() * 120;
      var dx = Math.cos(angle) * distance;
      var dy = Math.sin(angle) * distance - 60;
      var rotate = Math.random() * 720 - 360;
      piece.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rotate + 'deg)', opacity: 0 }
      ], { duration: 900 + Math.random()*400, easing: 'cubic-bezier(.22,.61,.36,1)' });
      (function (p) { setTimeout(function () { p.remove(); }, 1400); })(piece);
    }
  }
  window.fireConfetti = fireConfetti;

  // ---------- Scroll-to-top button ----------
  var scrollBtn = document.createElement('button');
  scrollBtn.className = 'scroll-top-btn';
  scrollBtn.setAttribute('aria-label', 'Scroll to top');
  scrollBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(scrollBtn);
  scrollBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  window.addEventListener('scroll', function () {
    if (window.scrollY > 400) scrollBtn.classList.add('show');
    else scrollBtn.classList.remove('show');
  }, { passive: true });

  // ---------- Header shadow on scroll ----------
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Scroll-reveal animation for cards & key blocks ----------
  var revealSelectors = [
    '.service-card', '.project-card', '.review-card', '.value-card',
    '.pay-card', '.timeline-item', '.stats-strip', '.two-col > div',
    '.rating-summary'
  ];
  var revealEls = document.querySelectorAll(revealSelectors.join(','));
  revealEls.forEach(function (el, i) {
    el.classList.add('reveal');
    el.style.transitionDelay = (Math.min(i % 6, 5) * 70) + 'ms';
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  // Highlight the current page in the nav automatically.
  // Written to work whether the URL has ".html" on the end or not —
  // Netlify serves pages without the extension (e.g. "/profile" instead
  // of "/profile.html"), so both forms need to match the same nav link.
  function normalizePage(raw) {
    var last = (raw || '').split('/').pop().split('?')[0].split('#')[0];
    last = last.replace(/\.html$/i, '');
    return last === '' ? 'index' : last;
  }
  var currentPage = normalizePage(window.location.pathname);
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var hrefPage = normalizePage(a.getAttribute('href'));
    if (hrefPage === currentPage) {
      a.classList.add('active');
    }
  });

  // ---------- Recent Projects: category filter ----------
  var filterButtons = document.querySelectorAll('.filter-btn');
  var projectsGrid = document.querySelector('.projects-grid');
  if (filterButtons.length && document.querySelectorAll('.project-card').length) {
    var applyFilter = function (cat) {
      // Re-scan every time (not just once at page load) so cards added
      // later — e.g. dynamically loaded from the admin panel — are
      // included instead of always staying visible.
      var projectCards = document.querySelectorAll('.project-card');
      filterButtons.forEach(function (b) { b.classList.remove('active'); });
      var matchedBtn = null;
      filterButtons.forEach(function (b) {
        if (b.getAttribute('data-filter') === cat) matchedBtn = b;
      });
      (matchedBtn || filterButtons[0]).classList.add('active');
      projectCards.forEach(function (card) {
        if (card.getAttribute('data-category') === cat) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
      // Every visible photo already belongs to the picked category, so the
      // redundant tag on each thumbnail can stay hidden.
      if (projectsGrid) projectsGrid.classList.add('hide-tags');
    };

    // Exposed so newly-added project cards (loaded later via fetch) can
    // trigger a re-filter against whichever category is currently active.
    window.herambReapplyProjectFilter = function () {
      var activeBtn = document.querySelector('.filter-btn.active') || filterButtons[0];
      applyFilter(activeBtn.getAttribute('data-filter'));
    };

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterButtons.forEach(function (b) { b.classList.remove('pointed-hint'); });
        var hint = document.getElementById('tapHint');
        if (hint) hint.style.display = 'none';
        applyFilter(btn.getAttribute('data-filter'));
      });
    });

    // If we arrived here via a link like projects.html?filter=print, don't show
    // any projects yet — just point at the matching category button and ask
    // the person to tap it themselves to reveal those projects.
    var urlFilter = new URLSearchParams(window.location.search).get('filter');
    if (!urlFilter) {
      // No specific category requested via link — just show whichever
      // category button is marked active in the HTML (defaults to the
      // first one) so the grid always matches the highlighted tab.
      var defaultBtn = document.querySelector('.filter-btn.active') || filterButtons[0];
      applyFilter(defaultBtn.getAttribute('data-filter'));
    } else {
      // Arrived here via a service card link like projects.html?filter=print —
      // jump straight to that category's photos, already filtered.
      var matchExists = false;
      filterButtons.forEach(function (b) { if (b.getAttribute('data-filter') === urlFilter) matchExists = true; });
      applyFilter(matchExists ? urlFilter : (filterButtons[0] && filterButtons[0].getAttribute('data-filter')));
      var bar = document.querySelector('.filter-bar');
      if (bar) {
        setTimeout(function () { bar.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50);
      }
    }
  }

  // ---------- Payment page: copy-to-clipboard for UPI ID ----------
  var copyBtn = document.getElementById('copyUpiBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var upiId = document.getElementById('upiIdText').textContent.trim();
      navigator.clipboard.writeText(upiId).then(function () {
        var original = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        if (window.fireConfetti) window.fireConfetti(copyBtn);
        setTimeout(function () {
          copyBtn.textContent = original;
          copyBtn.classList.remove('copied');
        }, 1800);
      });
    });
  }

  // ---------- UPI QR code + Pay Now link (payment.html) ----------
  var UPI_ID = '9421990387@ybl';
  var UPI_PAYEE_NAME = 'Heramb Designing and Printing';
  var qrImg = document.getElementById('qrImg');
  var payNowBtn = document.getElementById('payNowBtn');
  var payAmountInput = document.getElementById('payAmount');

  function buildUpiUri(amount) {
    var params = 'pa=' + encodeURIComponent(UPI_ID) +
      '&pn=' + encodeURIComponent(UPI_PAYEE_NAME) +
      '&cu=INR';
    if (amount && parseFloat(amount) > 0) {
      params += '&am=' + encodeURIComponent(amount);
    }
    return 'upi://pay?' + params;
  }

  function refreshUpiQr() {
    if (!qrImg && !payNowBtn) return;
    var amount = payAmountInput ? payAmountInput.value.trim() : '';
    var upiUri = buildUpiUri(amount);
    if (qrImg) {
      // Renders a real, scannable QR code pointing straight at the UPI ID above.
      qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(upiUri);
    }
    if (payNowBtn) {
      payNowBtn.setAttribute('href', upiUri);
    }
  }
  if (qrImg || payNowBtn) {
    refreshUpiQr();
    if (payAmountInput) {
      payAmountInput.addEventListener('input', refreshUpiQr);
    }
  }

  // ---------- Local enquiry storage (works even with no backend at all) ----------
  // Every enquiry is saved into this browser's localStorage as a permanent
  // backup, in addition to (best-effort) being sent to the backend. The
  // admin panel reads both and merges them, so data is never lost just
  // because the backend was asleep at the time.
  function saveEnquiryLocally(entry) {
    try {
      var key = 'heramb_enquiries';
      var existing = JSON.parse(localStorage.getItem(key) || '[]');
      entry.id = 'local-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      entry.created_at = new Date().toLocaleString('en-IN');
      entry.status = entry.status || 'new';
      existing.unshift(entry);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (err) {
      console.error('Could not save enquiry locally:', err);
    }
  }
  window.HERAMB_saveEnquiryLocally = saveEnquiryLocally;

  // ---------- Local review storage (mirrors enquiries above) ----------
  function saveReviewLocally(entry) {
    try {
      var key = 'heramb_reviews';
      var existing = JSON.parse(localStorage.getItem(key) || '[]');
      entry.id = 'local-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      entry.created_at = new Date().toLocaleString('en-IN');
      entry.status = entry.status || 'pending';
      existing.unshift(entry);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (err) {
      console.error('Could not save review locally:', err);
    }
  }
  window.HERAMB_saveReviewLocally = saveReviewLocally;

  // ---------- Write a Review form (reviews.html) ----------
  var reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    var selectedRating = 0;
    var starPicker = document.getElementById('starPicker');
    var ratingInput = document.getElementById('rReviewRating');
    if (starPicker) {
      var starEls = Array.prototype.slice.call(starPicker.querySelectorAll('span'));
      var paintStars = function (n) {
        starEls.forEach(function (s, i) { s.classList.toggle('filled', i < n); });
      };
      starEls.forEach(function (s, i) {
        s.addEventListener('click', function () {
          selectedRating = i + 1;
          ratingInput.value = selectedRating;
          paintStars(selectedRating);
        });
        s.addEventListener('mouseenter', function () { paintStars(i + 1); });
      });
      starPicker.addEventListener('mouseleave', function () { paintStars(selectedRating); });
    }

    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var msgBox = document.getElementById('reviewFormMessage');
      var submitBtn = reviewForm.querySelector('button[type="submit"]');
      var name = document.getElementById('rName').value.trim();
      var role = document.getElementById('rRole') ? document.getElementById('rRole').value.trim() : '';
      var phone = document.getElementById('rPhone') ? document.getElementById('rPhone').value.trim() : '';
      var reviewText = document.getElementById('rReviewText').value.trim();
      var rating = parseInt(ratingInput.value, 10) || 0;

      var showMsg = function (text) {
        if (msgBox) { msgBox.textContent = text; msgBox.style.display = 'block'; }
      };

      if (!name || !reviewText || !rating) {
        showMsg('Please add your name, a star rating and a short review.');
        return;
      }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

      // 1) Notify the owner on WhatsApp immediately with the full review —
      //    it only gets published on the site once approved in the admin panel.
      var waNumber = window.HERAMB_WHATSAPP_NUMBER || '919579480187';
      var stars = '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(0, 5 - rating);
      var waText = 'New customer review submitted on the website:\n' +
        'Name: ' + name + (role ? (' (' + role + ')') : '') + '\n' +
        'Rating: ' + stars + ' (' + rating + '/5)\n' +
        'Review: ' + reviewText + '\n' +
        (phone ? ('Phone: ' + phone + '\n') : '') +
        '\nReply "approve" or approve it in the admin panel to publish it on the Reviews page.';
      window.open('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(waText), '_blank', 'noopener');

      // 2) Send to the backend so it shows in admin.html for one-tap
      //    approve/reject. Only falls back to a local-only copy if this
      //    fails — otherwise a successful submission would show up twice.
      var apiBase = window.HERAMB_API_BASE || '';
      fetch(apiBase + '/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, role: role, phone: phone, rating: rating, reviewText: reviewText })
      })
        .catch(function () {
          saveReviewLocally({ name: name, role: role, phone: phone, rating: rating, review_text: reviewText });
        })
        .finally(function () {
          showMsg('Thanks ' + name + '! Your review has been sent to us on WhatsApp and will appear on this page once we approve it.');
          if (window.fireConfetti) window.fireConfetti(submitBtn);
          reviewForm.reset();
          selectedRating = 0;
          ratingInput.value = '';
          if (starPicker) paintStars(0);
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Review →'; }
        });
    });
  }

  // ---------- Load approved reviews from the backend, render them, and ----------
  // ---------- recalculate the average rating live from real data ----------
  var approvedGrid = document.getElementById('approvedReviewGrid');
  var ratingBigNum = document.getElementById('ratingBigNum');
  var avgRatingStat = document.getElementById('avgRatingStat');
  var ratingBars = document.querySelectorAll('#ratingBars .bar-row');

  if (approvedGrid || ratingBigNum || avgRatingStat) {
    var toggleBtn = document.getElementById('reviewsToggleBtn');
    var toggleLabel = document.getElementById('reviewsToggleLabel');
    var toggleWrap = document.querySelector('.reviews-toggle-wrap');
    var VISIBLE_COUNT = 3;
    var expanded = false;

    function refreshReviewsToggle() {
      if (!approvedGrid || !toggleBtn || !toggleWrap) return;
      var total = approvedGrid.querySelectorAll('.review-card').length;
      if (total <= VISIBLE_COUNT) {
        toggleWrap.hidden = true;
        return;
      }
      toggleWrap.hidden = false;
      toggleLabel.textContent = expanded ? 'Show Fewer Reviews' : 'Show All Reviews (' + total + ')';
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        expanded = !expanded;
        approvedGrid.classList.toggle('expanded', expanded);
        toggleBtn.classList.toggle('open', expanded);
        refreshReviewsToggle();
        if (!expanded) {
          approvedGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    refreshReviewsToggle();

    var apiBase2 = window.HERAMB_API_BASE || '';
    fetch(apiBase2 + '/api/reviews/approved')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var rows = data.reviews || [];

        // Render each approved review as a card (reviews.html only) —
        // added to the TOP of the grid (before the placeholder examples
        // already in the HTML) so a newly approved review is immediately
        // visible instead of being hidden below 6 sample cards.
        if (approvedGrid && rows.length) {
          rows.slice().reverse().forEach(function (r) {
            var card = document.createElement('div');
            card.className = 'review-card reveal in-view';
            var initials = (r.name || '?').trim().split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase();
            var starsHtml = '★★★★★'.slice(0, r.rating).split('').map(function (ch) { return '<span>' + ch + '</span>'; }).join('') +
              '☆☆☆☆☆'.slice(0, 5 - r.rating);
            card.innerHTML =
              '<div class="review-stars">' + starsHtml + '</div>' +
              '<p class="review-text"></p>' +
              '<div class="review-person"><div class="review-avatar"></div><div><div class="review-name"></div><div class="review-role"></div></div></div>';
            card.querySelector('.review-text').textContent = r.review_text;
            card.querySelector('.review-avatar').textContent = initials;
            card.querySelector('.review-name').textContent = r.name;
            card.querySelector('.review-role').textContent = r.role || 'Customer';
            approvedGrid.insertBefore(card, approvedGrid.firstChild);
          });
          refreshReviewsToggle();
        }

        // Recalculate the average rating from real approved reviews.
        // Until there's at least one real approved review, the page keeps
        // showing the starting baseline of 4.9 set in the HTML.
        if (rows.length) {
          var sum = 0;
          var counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          rows.forEach(function (r) {
            var s = Math.max(1, Math.min(5, parseInt(r.rating, 10) || 0));
            sum += s;
            counts[s] = (counts[s] || 0) + 1;
          });
          var avg = sum / rows.length;
          var avgRounded = Math.round(avg * 10) / 10;

          if (ratingBigNum) ratingBigNum.textContent = avgRounded.toFixed(1);
          if (avgRatingStat) avgRatingStat.textContent = avgRounded.toFixed(1) + '★';

          var ratingBigStars = document.getElementById('ratingBigStars');
          if (ratingBigStars) {
            var filled = Math.round(avg);
            ratingBigStars.innerHTML = '★★★★★'.slice(0, filled).split('').map(function (ch) { return '<span>' + ch + '</span>'; }).join('') +
              '☆☆☆☆☆'.slice(0, 5 - filled).split('').map(function (ch) { return '<span>' + ch + '</span>'; }).join('');
          }

          if (ratingBars.length) {
            ratingBars.forEach(function (row) {
              var star = parseInt(row.getAttribute('data-stars'), 10);
              var pct = Math.round((counts[star] / rows.length) * 100);
              var fill = row.querySelector('.bar-fill');
              var pctLabel = row.querySelector('.bar-pct');
              if (fill) fill.style.width = pct + '%';
              if (pctLabel) pctLabel.textContent = pct + '%';
              row.setAttribute('data-pct', pct);
            });
          }
        }
      })
      .catch(function () { /* backend unreachable — page still works with the baseline rating */ });
  }

  // ---------- Enquiry form: saves customer details + notifies via WhatsApp ----------
  var enquiryForm = document.getElementById('enquiryForm');
  if (enquiryForm) {
    enquiryForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var msgBox = document.getElementById('formMessage');
      var submitBtn = enquiryForm.querySelector('button[type="submit"]');
      var name = document.getElementById('fName').value.trim();
      var phone = document.getElementById('fPhone').value.trim();
      var service = document.getElementById('fService') ? document.getElementById('fService').value : '';
      var amount = document.getElementById('fAmount') ? document.getElementById('fAmount').value.trim() : '';
      var message = document.getElementById('fMessage') ? document.getElementById('fMessage').value.trim() : '';
      var sourcePage = window.location.pathname.split('/').pop() || 'payment.html';

      var apiBase = window.HERAMB_API_BASE || '';
      var showMessage = function (text) {
        if (msgBox) {
          msgBox.textContent = text;
          msgBox.style.display = 'block';
        }
      };

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

      // 1) Open a pre-filled WhatsApp message to the business number so the
      //    enquiry reaches a real phone instantly — this doesn't depend on
      //    any backend being online. (Opened synchronously, in direct
      //    response to the click, so browsers won't block it as a popup.)
      var waNumber = window.HERAMB_WHATSAPP_NUMBER || '919579480187';
      var waText = 'New enquiry from the website:\n' +
        'Name: ' + (name || '-') + '\n' +
        'Phone: ' + (phone || '-') + '\n' +
        'Service: ' + (service || '-') + '\n' +
        (amount ? ('Amount: ₹' + amount + '\n') : '') +
        (message ? ('Message: ' + message + '\n') : '') +
        'Page: ' + sourcePage;
      window.open('https://wa.me/' + waNumber + '?text=' + encodeURIComponent(waText), '_blank', 'noopener');

      fetch(apiBase + '/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name, phone: phone, service: service, message: message, amount: amount,
          sourcePage: window.location.pathname.split('/').pop() || 'payment.html'
        })
      })
        .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (result) {
          if (result.ok) {
            showMessage('Thanks ' + (name || 'there') + '! Your enquiry is saved and a WhatsApp message has opened in a new tab — please hit send there so we see it right away.');
          } else {
            // Server responded but rejected/failed to save it — keep a
            // local copy so it isn't lost, and admin.html will show it
            // with a 📱 icon meaning "saved on this device only".
            saveEnquiryLocally({
              name: name, phone: phone, service: service, amount: amount,
              message: message, source_page: sourcePage
            });
            showMessage('Saved! A WhatsApp message has opened in a new tab — please hit send there so we don\'t miss your enquiry.');
          }
          if (window.fireConfetti) window.fireConfetti(submitBtn);
          enquiryForm.reset();
          refreshUpiQr();
        })
        .catch(function () {
          // Couldn't reach the backend at all (asleep / offline) — this is
          // the ONLY case a local copy is saved, so a successful server
          // save never also shows up as a duplicate local entry.
          saveEnquiryLocally({
            name: name, phone: phone, service: service, amount: amount,
            message: message, source_page: sourcePage
          });
          showMessage('Saved on this device. A WhatsApp message has also opened in a new tab — please hit send there so we don\'t miss your enquiry.');
          if (window.fireConfetti) window.fireConfetti(submitBtn);
          enquiryForm.reset();
          refreshUpiQr();
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Enquiry →'; }
        });
    });
  }
});

// Footer "Services" links (and any other #service-xxx link) jump straight
// to that exact service card on the homepage and briefly highlight it —
// instead of landing generically at the top of the whole Services section.
document.addEventListener('DOMContentLoaded', function () {
  function highlightServiceFromHash() {
    var hash = window.location.hash;
    if (!hash || hash.indexOf('#service-') !== 0) return;
    var target = document.getElementById(hash.slice(1));
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target.classList.add('jump-highlight');
    setTimeout(function () { target.classList.remove('jump-highlight'); }, 2400);
  }

  highlightServiceFromHash();
  window.addEventListener('hashchange', highlightServiceFromHash);
});
