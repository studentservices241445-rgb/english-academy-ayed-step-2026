// app.js: وظائف عامة للموقع (التنقل، المساعد العائم، الإشعارات، PWA)

document.addEventListener('DOMContentLoaded', () => {
  // تفعيل رابط النافبار النشط بناءً على المسار
  const current = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href.endsWith(current)) {
      link.classList.add('active');
    }
  });

  // تفعيل زر الهامبرغر للتنقل في الأجهزة الصغيرة
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // تفعيل المساعد العائم
  const assistantButton = document.getElementById('assistantButton');
  const assistantPanel = document.getElementById('assistantPanel');
  const closeAssistant = document.getElementById('closeAssistant');
  if (assistantButton && assistantPanel) {
    assistantButton.addEventListener('click', () => {
      assistantPanel.classList.toggle('open');
    });
    if (closeAssistant) {
      closeAssistant.addEventListener('click', () => assistantPanel.classList.remove('open'));
    }
  }

  // تفعيل شريط التنبيهات (ticker) إذا وُجد عنصر في الصفحة
  const tickerEl = document.getElementById('ticker');
  if (tickerEl && Array.isArray(window.AYED_TICKER)) {
    let idx = 0;
    tickerEl.textContent = window.AYED_TICKER[idx % window.AYED_TICKER.length];
    setInterval(() => {
      idx++;
      tickerEl.textContent = window.AYED_TICKER[idx % window.AYED_TICKER.length];
    }, 8000);
  }

  // تفعيل إشعارات التوست بشكل دوري
  if (Array.isArray(window.AYED_TOASTS)) {
    let toastIndex = 0;
    setInterval(() => {
      toast(window.AYED_TOASTS[toastIndex % window.AYED_TOASTS.length]);
      toastIndex++;
    }, 30000);
  }

  // تسجيل خدمة العامل من أجل PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  // التعامل مع beforeinstallprompt لعرض شريط التثبيت
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBar = document.getElementById('installBar');
    if (installBar) {
      installBar.classList.add('show');
      installBar.querySelector('button.install-btn').onclick = () => {
        installBar.classList.remove('show');
        deferredPrompt.prompt();
        deferredPrompt = null;
      };
      installBar.querySelector('button.dismiss-btn').onclick = () => {
        installBar.classList.remove('show');
      };
    }
  });
});

// دالة إنشاء إشعار توست
function toast(message) {
  const container = document.createElement('div');
  container.className = 'toast';
  container.textContent = message;
  document.body.appendChild(container);
  setTimeout(() => {
    container.classList.add('show');
  }, 10);
  setTimeout(() => {
    container.classList.remove('show');
    setTimeout(() => container.remove(), 500);
  }, 4000);
}