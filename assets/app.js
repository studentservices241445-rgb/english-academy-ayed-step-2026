/*
  English Academy Ayed — STEP Intensive 2026
  assets/app.js (v2026-01-20)
  هدف الملف:
  - تفعيل قائمة الجوال
  - إبراز الرابط النشط
  - تحكم المساعد العائم + توستات
  - (اختياري) شريط تنبيه متحرك عبر data-attributes
*/

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- Toasts ----------
  function ensureToastWrap() {
    let wrap = $('#toasts');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toasts';
      wrap.className = 'toast-wrap';
      wrap.setAttribute('aria-live', 'polite');
      document.body.appendChild(wrap);
    }
    return wrap;
  }

  function showToast(message, type = 'info', timeout = 3500) {
    const wrap = ensureToastWrap();
    const t = document.createElement('div');
    t.className = `toast toast--${type}`;
    t.innerHTML = `
      <div class="toast__dot" aria-hidden="true"></div>
      <div class="toast__msg">${String(message)}</div>
      <button class="toast__x" type="button" aria-label="إغلاق">×</button>
    `;

    const kill = () => {
      t.classList.add('is-leaving');
      setTimeout(() => t.remove(), 220);
    };

    t.querySelector('.toast__x')?.addEventListener('click', kill);
    wrap.appendChild(t);
    setTimeout(kill, timeout);
  }

  // نخليها متاحة لباقي الملفات (مثل test.js / register.js) بدون تعارض
  window.AyedUI = window.AyedUI || {};
  window.AyedUI.toast = showToast;

  // ---------- Active Link Highlight ----------
  function setActiveNav() {
    const path = (location.pathname || '').split('/').pop() || 'index.html';
    $$('.nav-links a, .nav-drawer a').forEach((a) => {
      const href = (a.getAttribute('href') || '').split('#')[0];
      const file = href.split('/').pop();
      if (!file) return;
      const isActive = (file === path) || (path === '' && file === 'index.html');
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  // ---------- Mobile Nav Toggle ----------
  function initMobileNav() {
    const btn = $('#navToggle');
    const drawer = $('#navDrawer');
    if (!btn || !drawer) return;

    const close = () => {
      drawer.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    };

    const open = () => {
      drawer.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    };

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      expanded ? close() : open();
    });

    // إغلاق عند الضغط خارج القائمة
    document.addEventListener('click', (e) => {
      if (!drawer.classList.contains('is-open')) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (drawer.contains(target) || btn.contains(target)) return;
      close();
    });

    // إغلاق عند اختيار رابط
    $$('.nav-drawer a', drawer).forEach((a) => a.addEventListener('click', close));

    // إغلاق بالـ ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });
  }

  // ---------- Assistant (Floating) ----------
  function initAssistant() {
    const fab = $('#assistantFab');
    const panel = $('#assistantPanel');
    const closeBtn = $('#assistantClose');
    if (!fab || !panel) return;

    const open = () => {
      panel.classList.add('is-open');
      fab.setAttribute('aria-expanded', 'true');
    };

    const close = () => {
      panel.classList.remove('is-open');
      fab.setAttribute('aria-expanded', 'false');
    };

    fab.addEventListener('click', () => {
      const expanded = fab.getAttribute('aria-expanded') === 'true';
      expanded ? close() : open();
    });

    closeBtn?.addEventListener('click', close);

    // أزرار التنقل السريع داخل المساعد (data-go)
    $$('.assistant__btn', panel).forEach((b) => {
      b.addEventListener('click', () => {
        const go = b.getAttribute('data-go');
        if (!go) return;
        // go ممكن يكون صفحة أو #قسم
        if (go.startsWith('#')) {
          const el = document.querySelector(go);
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          close();
        } else {
          location.href = go;
        }
      });
    });

    // إغلاق عند الضغط خارج اللوحة
    document.addEventListener('click', (e) => {
      if (!panel.classList.contains('is-open')) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (panel.contains(target) || fab.contains(target)) return;
      close();
    });
  }

  // ---------- Optional: Rotating Ticker ----------
  function initTicker() {
    const ticker = $('.ticker');
    if (!ticker) return;

    // يدعم طريقتين:
    // 1) data-messages='["msg1","msg2"]'
    // 2) عناصر داخلية <span class="ticker__msg">...</span>

    let messages = [];
    const raw = ticker.getAttribute('data-messages');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) messages = parsed.map(String);
      } catch { /* ignore */ }
    }

    if (!messages.length) {
      messages = $$('.ticker__msg', ticker).map((n) => n.textContent?.trim()).filter(Boolean);
    }

    if (!messages.length) return;

    const slot = $('.ticker__slot', ticker) || ticker;
    let i = 0;

    const render = () => {
      slot.textContent = messages[i % messages.length];
      i += 1;
    };

    render();
    const every = Number(ticker.getAttribute('data-interval')) || 4500;
    setInterval(render, every);
  }

  // ---------- Boot ----------
  document.addEventListener('DOMContentLoaded', () => {
    // سنة الفوتر (لو موجود)
    const y = $('#year');
    if (y) y.textContent = String(new Date().getFullYear());

    setActiveNav();
    initMobileNav();
    initAssistant();
    initTicker();
  });
})();
