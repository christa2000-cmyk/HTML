/* ══════════════════════════════════════════════════════
   Premium Eco Rentals — Scripted Chatbot Widget
   Floating assistant with quick-replies + keyword match
══════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Knowledge Base ────────────────────────────────── */
  const KB = [
    {
      id: 'cancellation',
      keywords: ['cancel', 'cancellation', 'refund', 'money back', 'modify', 'change booking'],
      title: 'Cancellation Policy',
      answer:
        'Our cancellation policy is as follows:\n\n' +
        '• <strong>Free cancellation</strong> up to 48 hours before your scheduled pickup — full refund.\n' +
        '• <strong>Within 48 hours</strong> of pickup — 50% of the rental fee is retained.\n' +
        '• <strong>No-shows</strong> — the full rental fee is charged.\n\n' +
        'To cancel or modify a booking, visit <em>My Reservations</em> or contact our team directly.',
    },
    {
      id: 'insurance',
      keywords: ['insurance', 'coverage', 'damage', 'accident', 'waiver', 'cdw', 'collision', 'liability', 'protected'],
      title: 'Insurance & Coverage',
      answer:
        'All rentals include <strong>basic third-party liability coverage</strong> at no extra cost.\n\n' +
        'Optional upgrades available at checkout:\n\n' +
        '• <strong>Collision Damage Waiver (CDW)</strong> — reduces your liability for vehicle damage to zero.\n' +
        '• <strong>Personal Accident Cover</strong> — covers medical expenses for driver & passengers.\n' +
        '• <strong>Tire & Glass Protection</strong> — covers tyre punctures and windshield damage.\n\n' +
        'We recommend CDW for full peace of mind. Details are shown at the booking step.',
    },
    {
      id: 'age',
      keywords: ['age', 'old', 'young driver', 'minimum age', 'young', 'how old', 'license', 'licence', 'years old'],
      title: 'Age Requirements',
      answer:
        'Our standard age requirements:\n\n' +
        '• <strong>Minimum age: 21</strong> to rent any vehicle.\n' +
        '• Drivers aged <strong>21–24</strong> are subject to a Young Driver Surcharge.\n' +
        '• Drivers <strong>25 and over</strong> rent at standard rates with no surcharge.\n' +
        '• A <strong>valid driver\'s licence held for at least 1 year</strong> is required.\n\n' +
        'Elite and premium vehicles may require a minimum age of 25.',
    },
    {
      id: 'pickup',
      keywords: ['pickup', 'pick up', 'drop off', 'dropoff', 'location', 'where', 'address', 'return', 'hours', 'open'],
      title: 'Pickup & Dropoff',
      answer:
        'Pickup and dropoff details are confirmed at the time of booking on our reservations platform.\n\n' +
        '• Our team will coordinate your <strong>exact pickup address</strong> based on your location.\n' +
        '• We offer <strong>flexible pickup windows</strong> — just let us know your preferred time.\n' +
        '• Contactless key handover is available for Elite members.\n\n' +
        'Need to arrange a specific location? Contact us directly and we\'ll accommodate you.',
    },
    {
      id: 'eco',
      keywords: ['eco', 'green', 'environment', 'electric', 'hybrid', 'carbon', 'sustainable', 'emission'],
      title: 'Eco Vehicles',
      answer:
        'Over <strong>89% of our fleet is eco-certified</strong> — including hybrid and low-emission vehicles.\n\n' +
        '• Eco rentals contribute to our monthly <strong>CO₂ offset tracker</strong>.\n' +
        '• All eco vehicles meet or exceed EPA/environmental standards.\n' +
        '• Choosing an eco vehicle earns <strong>bonus Loyalty Points</strong> on eligible reservations.\n\n' +
        'Look for the <em>Eco-Certified</em> badge when browsing our fleet.',
    },
    {
      id: 'elite',
      keywords: ['elite', 'membership', 'vip', 'premium membership', 'join elite', 'member', 'loyalty', 'points', 'rewards'],
      title: 'Elite Membership & Loyalty',
      answer:
        'Our <strong>Elite Membership</strong> program offers exclusive perks:\n\n' +
        '• Priority access to premium & flagship vehicles\n' +
        '• Complimentary upgrades (subject to availability)\n' +
        '• Dedicated concierge booking support\n' +
        '• Accelerated Loyalty Point earn rate\n\n' +
        'Visit our <a href="Elite-Membership.html" style="color:#22D3EE;">Elite Membership page</a> to apply or learn more.',
    },
    {
      id: 'book',
      keywords: ['book', 'reserve', 'reservation', 'rent', 'how to book', 'make a booking', 'availability'],
      title: 'How to Book',
      answer:
        'Booking is fast and simple:\n\n' +
        '1. Visit our <a href="https://premiumecorentals2.us5.hqrentals.app/public/car-rental/reservations/step1?new=1&brand=blsea0wm-snln-xg0c-9xxu-esymdste3acy" target="_blank" style="color:#22D3EE;">online booking platform</a>\n' +
        '2. Choose your pickup date, time, and location\n' +
        '3. Browse available vehicles and select your preference\n' +
        '4. Add optional coverage and complete payment\n\n' +
        'You\'ll receive a confirmation by email with all your rental details.',
    },
    {
      id: 'contact',
      keywords: ['contact', 'call', 'phone', 'email', 'support', 'help', 'speak', 'human', 'agent', 'talk'],
      title: 'Contact Us',
      answer:
        'We\'re happy to help directly!\n\n' +
        '• Visit our <a href="Help.html" style="color:#22D3EE;">Help & Contact page</a> for all contact options.\n' +
        '• Our team typically responds within a few hours during business hours.\n\n' +
        'You can also manage existing reservations via the <a href="Digital-Hub.html#tracker" style="color:#22D3EE;">Digital Hub</a>.',
    },
  ];

  /* ── Quick Reply Topics ─────────────────────────────── */
  const QUICK_REPLIES = [
    { label: '🚫  Cancellation Policy', id: 'cancellation' },
    { label: '🛡️  Insurance & Coverage', id: 'insurance' },
    { label: '🎂  Age Requirements',     id: 'age' },
    { label: '📍  Pickup & Dropoff',     id: 'pickup' },
    { label: '🌿  Eco Vehicles',         id: 'eco' },
    { label: '⭐  Elite & Loyalty',      id: 'elite' },
    { label: '📅  How to Book',          id: 'book' },
    { label: '💬  Contact Us',           id: 'contact' },
  ];

  const WELCOME =
    'Hi there! 👋 I\'m <strong>Eco</strong>, your Premium Eco Rentals assistant.\n\n' +
    'I can answer your questions about cancellations, insurance, age requirements, eco vehicles, memberships and more.\n\n' +
    'Select a topic below or type your question:';

  const FALLBACK =
    'I\'m not sure about that one — try rephrasing, or pick a topic below. For complex questions, our team is happy to help directly via the <a href="Help.html" style="color:#22D3EE;">Contact page</a>.';

  /* ── Build DOM ─────────────────────────────────────── */
  function buildWidget() {
    // Toggle button
    const toggle = document.createElement('button');
    toggle.id = 'per-chat-toggle';
    toggle.setAttribute('aria-label', 'Open chat assistant');
    toggle.innerHTML = `
      <span id="per-chat-badge"></span>
      <i class="ri-customer-service-2-line per-chat-icon-open"></i>
      <i class="ri-close-line per-chat-icon-close"></i>
    `;

    // Panel
    const panel = document.createElement('div');
    panel.id = 'per-chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Chat assistant');
    panel.innerHTML = `
      <div id="per-chat-header">
        <div class="per-chat-avatar"><i class="ri-robot-2-line"></i></div>
        <div class="per-chat-header-info">
          <div class="per-chat-header-name">Eco &mdash; PER Assistant</div>
          <div class="per-chat-header-status">
            <span class="per-chat-status-dot"></span> Online &nbsp;&middot;&nbsp; Instant replies
          </div>
        </div>
        <button id="per-chat-minimize" title="Minimize" aria-label="Minimize chat">
          <i class="ri-subtract-line"></i>
        </button>
      </div>
      <div id="per-chat-messages"></div>
      <div id="per-chat-quick-replies"></div>
      <div id="per-chat-input-row">
        <input id="per-chat-input" type="text" placeholder="Type a question…" autocomplete="off" />
        <button id="per-chat-send" aria-label="Send"><i class="ri-send-plane-fill"></i></button>
      </div>
    `;

    document.body.appendChild(toggle);
    document.body.appendChild(panel);
  }

  /* ── Message Helpers ───────────────────────────────── */
  const messagesEl    = () => document.getElementById('per-chat-messages');
  const quickRepliesEl = () => document.getElementById('per-chat-quick-replies');

  function appendMessage(html, type) {
    const el = document.createElement('div');
    el.className = `per-msg per-msg--${type}`;
    el.innerHTML = html.replace(/\n/g, '<br>');
    messagesEl().appendChild(el);
    messagesEl().scrollTop = messagesEl().scrollHeight;
    return el;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'per-msg per-msg--typing';
    el.id = 'per-chat-typing';
    el.innerHTML = `
      <span class="per-typing-dot"></span>
      <span class="per-typing-dot"></span>
      <span class="per-typing-dot"></span>
    `;
    messagesEl().appendChild(el);
    messagesEl().scrollTop = messagesEl().scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('per-chat-typing');
    if (el) el.remove();
  }

  function botReply(html, delay = 520) {
    showTyping();
    setTimeout(() => {
      hideTyping();
      appendMessage(html, 'bot');
      renderQuickReplies();
    }, delay);
  }

  /* ── Quick Replies ─────────────────────────────────── */
  function renderQuickReplies() {
    const wrap = quickRepliesEl();
    wrap.innerHTML = '';
    QUICK_REPLIES.forEach(qr => {
      const btn = document.createElement('button');
      btn.className = 'per-qr-btn';
      btn.textContent = qr.label;
      btn.addEventListener('click', () => handleTopic(qr.id, qr.label));
      wrap.appendChild(btn);
    });
  }

  /* ── Lookup ────────────────────────────────────────── */
  function findMatch(text) {
    const lower = text.toLowerCase().trim();
    for (const entry of KB) {
      if (entry.keywords.some(kw => lower.includes(kw))) return entry;
    }
    return null;
  }

  function handleTopic(id, labelText) {
    const entry = KB.find(e => e.id === id);
    if (!entry) return;
    appendMessage(labelText || entry.title, 'user');
    quickRepliesEl().innerHTML = '';
    botReply(entry.answer);
  }

  function handleInput(text) {
    if (!text.trim()) return;
    appendMessage(text, 'user');
    document.getElementById('per-chat-input').value = '';
    quickRepliesEl().innerHTML = '';
    const match = findMatch(text);
    botReply(match ? match.answer : FALLBACK);
  }

  /* ── Toggle Logic ──────────────────────────────────── */
  let opened = false;

  function openPanel() {
    document.getElementById('per-chat-toggle').classList.add('is-open');
    document.getElementById('per-chat-panel').classList.add('is-open');
    document.getElementById('per-chat-badge').style.display = 'none';
    if (!opened) {
      opened = true;
      botReply(WELCOME, 300);
    }
    setTimeout(() => document.getElementById('per-chat-input').focus(), 350);
  }

  function closePanel() {
    document.getElementById('per-chat-toggle').classList.remove('is-open');
    document.getElementById('per-chat-panel').classList.remove('is-open');
  }

  /* ── Init ──────────────────────────────────────────── */
  function init() {
    // Ensure Remixicon is available
    if (!document.querySelector('link[href*="remixicon"]')) {
      const ri = document.createElement('link');
      ri.rel = 'stylesheet';
      ri.href = 'https://cdn.jsdelivr.net/npm/remixicon@4.8.0/fonts/remixicon.css';
      document.head.appendChild(ri);
    }

    buildWidget();

    document.getElementById('per-chat-toggle').addEventListener('click', () => {
      const isOpen = document.getElementById('per-chat-panel').classList.contains('is-open');
      isOpen ? closePanel() : openPanel();
    });

    document.getElementById('per-chat-minimize').addEventListener('click', closePanel);

    document.getElementById('per-chat-send').addEventListener('click', () => {
      handleInput(document.getElementById('per-chat-input').value);
    });

    document.getElementById('per-chat-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') handleInput(document.getElementById('per-chat-input').value);
    });

    // Show badge after 4s if not opened
    setTimeout(() => {
      if (!opened) {
        const badge = document.getElementById('per-chat-badge');
        badge.textContent = '1';
        badge.style.display = 'flex';
      }
    }, 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
