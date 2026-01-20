/*
  Ayed Academy — STEP Intensive 2026
  Core UI + shared behaviors
*/

(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const STORAGE = {
    completedKey: 'step_test.completed',
    resultKey: 'step_test.result',
    profileKey: 'step_test.profile',
  };

  const CONFIG = {
    priceNow: 349,
    priceOfficial: 599,
    seatsLeft: 27,
    telegramHandle: 'Ayed_Academy_2026',
    ticker: [
      'تذكير لطيف: السعر يظهر بعد اختبار تحديد المستوى 👀',
      'اختبارك 20 سؤال فقط… ونعطيك خطة واضحة بدل التشتت ✅',
      'التفعيل يتم بعد وصول الإيصال للحساب الرسمي — بدون عشوائية 💼',
      'لا تكثر مصادر… خلك على خطة وحدة وامشِ عليها 🔥',
    ],
    toasts: [
      {title: 'تنبيه المقاعد', body: 'تم تحديث المقاعد المتاحة. إذا اختبارك قريب… اختبر وخذ خطة مباشرة.'},
      {title: 'نصيحة مذاكرة', body: 'خصص 20–30 دقيقة يوميًا لليسننق… الاستمرارية هنا تسوي فرق.'},
      {title: 'تذكير', body: 'السعر الرسمي يرتفع بعد اكتمال المقاعد — خلّص اختبارك أولًا.'},
      {title: 'تحديث', body: 'إذا حسّيت ضياع: ارجع للخطة وامشِ بالترتيب… لا تفلت.'},
    ]
  };

  window.AYED = { STORAGE, CONFIG };

  function isTestCompleted(){
    return localStorage.getItem(STORAGE.completedKey) === 'true';
  }

  function safeJSONParse(str){
    try { return JSON.parse(str); } catch(e){ return null; }
  }

  function initActiveNav(){
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('.nav a').forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if(!href) return;
      if(href === path){ a.classList.add('active'); }
    });
  }

  function initMobileNav(){
    const btn = $('.nav-toggle');
    const menu = $('.nav');
    if(!btn || !menu) return;
    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('.nav a').forEach(a => a.addEventListener('click', () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }));
  }

  function initGating(){
    const completed = isTestCompleted();

    // Hide anything that requires the test
    $$('[data-requires-test="true"]').forEach(el => {
      if(completed) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    // Swap CTA texts
    $$('[data-cta-register]').forEach(el => {
      if(completed){
        el.textContent = 'التسجيل وتأكيد الدفع';
        el.setAttribute('href','register.html');
      } else {
        el.textContent = 'ابدأ اختبار تحديد المستوى';
        el.setAttribute('href','level-test.html');
      }
    });

    // Update price + seats if present
    $$('[data-price-now]').forEach(el => el.textContent = CONFIG.priceNow);
    $$('[data-price-official]').forEach(el => el.textContent = CONFIG.priceOfficial);
    $$('[data-seats-left]').forEach(el => el.textContent = CONFIG.seatsLeft);
  }

  function initTicker(){
    const bar = $('.ticker');
    if(!bar) return;
    const line = $('.ticker .line');
    if(!line) return;
    let i = 0;
    line.textContent = CONFIG.ticker[i];
    setInterval(() => {
      i = (i + 1) % CONFIG.ticker.length;
      line.classList.remove('tick-anim');
      void line.offsetWidth;
      line.classList.add('tick-anim');
      line.textContent = CONFIG.ticker[i];
    }, 9000);
  }

  function initToasts(){
    const wrap = $('#toastWrap');
    if(!wrap) return;

    const key = 'step_toast.last';
    const last = Number(localStorage.getItem(key) || '0');
    const now = Date.now();

    // show at most once every 30s per user
    if(now - last < 30000) return;

    function showToast(msg){
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = `
        <div class="row">
          <div>
            <strong>${escapeHTML(msg.title)}</strong>
            <p>${escapeHTML(msg.body)}</p>
          </div>
          <button type="button" aria-label="إغلاق">×</button>
        </div>
      `;
      const btn = $('button', el);
      btn.addEventListener('click', () => el.remove());
      wrap.appendChild(el);
      setTimeout(() => { if(el.isConnected) el.remove(); }, 9000);
    }

    // Delay so it doesn't hit immediately
    const delay = 1600 + Math.floor(Math.random()*1200);
    setTimeout(() => {
      const pick = CONFIG.toasts[Math.floor(Math.random()*CONFIG.toasts.length)];
      showToast(pick);
      localStorage.setItem(key, String(Date.now()));
    }, delay);
  }

  function initAssistant(){
    const shell = $('#assistant');
    if(!shell) return;

    const fab = $('#assistantFab');
    const panel = $('#assistantPanel');
    const close = $('#assistantClose');

    const open = () => {
      panel.classList.add('open');
      fab.setAttribute('aria-expanded','true');
    };
    const shut = () => {
      panel.classList.remove('open');
      fab.setAttribute('aria-expanded','false');
    };

    fab?.addEventListener('click', () => panel.classList.contains('open') ? shut() : open());
    close?.addEventListener('click', shut);

    // Quick buttons
    $$('.assistant .qa button').forEach(btn => {
      btn.addEventListener('click', () => {
        const go = btn.getAttribute('data-go');
        if(go) location.href = go;
      });
    });

    // Persist last state per session
    const k = 'assistant.open';
    const was = sessionStorage.getItem(k) === 'true';
    if(was) open();
    panel.addEventListener('transitionend', () => {
      sessionStorage.setItem(k, panel.classList.contains('open') ? 'true' : 'false');
    });
  }

  function escapeHTML(s){
    return String(s)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function initCopyButtons(){
    $$('[data-copy]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const sel = btn.getAttribute('data-copy');
        const target = sel ? $(sel) : null;
        const value = target?.textContent?.trim() || btn.getAttribute('data-copy-text');
        if(!value) return;
        try{
          await navigator.clipboard.writeText(value);
          btn.textContent = 'تم النسخ ✅';
          setTimeout(() => btn.textContent = 'نسخ', 1200);
        }catch(e){
          // fallback
          const ta = document.createElement('textarea');
          ta.value = value;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          btn.textContent = 'تم النسخ ✅';
          setTimeout(() => btn.textContent = 'نسخ', 1200);
        }
      });
    });
  }

  function initRevealOnScroll(){
    const items = $$('.reveal');
    if(!items.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if(en.isIntersecting){
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, {threshold: 0.12});

    items.forEach(el => io.observe(el));
  }

  // ===== Public helpers used by other pages =====
  window.AYED_getProfile = () => safeJSONParse(localStorage.getItem(STORAGE.profileKey) || '');
  window.AYED_getResult = () => safeJSONParse(localStorage.getItem(STORAGE.resultKey) || '');
  window.AYED_isCompleted = isTestCompleted;

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    initActiveNav();
    initMobileNav();
    initGating();
    initTicker();
    initToasts();
    initAssistant();
    initCopyButtons();
    initRevealOnScroll();

    // Show subtle status
    const st = $('#testStatus');
    if(st){
      st.innerHTML = isTestCompleted()
        ? '<span class="pill ok">مُكتمل</span> <span class="muted">اختبار المستوى محفوظ على جهازك</span>'
        : '<span class="pill warn">غير مكتمل</span> <span class="muted">أكمل اختبار المستوى لإظهار السعر وخيارات التسجيل</span>';
    }
  });
})();
