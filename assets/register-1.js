/* Register page: copy bank data + validate + generate telegram message */

(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const {STORAGE, CONFIG} = window.AYED;

  const completed = localStorage.getItem(STORAGE.completedKey) === 'true';
  const root = document.querySelector('[data-register-root]');
  if (!root) return;

  const gate = root.querySelector('[data-gate]');
  const form = $('#regForm');

  function loadProfile(){
    try{ return JSON.parse(localStorage.getItem(STORAGE.profileKey) || 'null'); }
    catch(_){ return null; }
  }

  const profile = loadProfile();

  if (!completed) {
    gate.classList.remove('hidden');
    if (form) {
      form.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = true);
    }
    return;
  }

  // Prefill
  if (profile && form) {
    const setVal = (name, val) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el && val != null && val !== '') el.value = val;
    };
    setVal('fullName', profile.fullName);
    setVal('examDate', profile.examDate);
    setVal('tookBefore', profile.tookBefore);
    setVal('prevScore', profile.prevScore);
    setVal('targetScore', profile.targetScore);
    setVal('region', profile.region);
    setVal('contactPref', profile.contactPref);
    setVal('contactValue', profile.contactValue);
  }

  // Copy buttons
  $$('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const txt = btn.getAttribute('data-copy') || '';
      try{
        await navigator.clipboard.writeText(txt);
        btn.textContent = 'تم النسخ ✅';
        setTimeout(() => btn.textContent = 'نسخ', 1200);
      }catch(e){
        btn.textContent = 'انسخ يدويًا';
      }
    });
  });

  function buildTelegramMessage(data){
    const lines = [
      'السلام عليكم ورحمة الله وبركاته',
      '',
      'تم التحويل للاشتراك في «دورة STEP المكثفة 2026» وأرسل لكم الإيصال الآن للتأكيد والتفعيل.',
      '',
      `الاسم: ${data.fullName || '—'}`,
      `موعد الاختبار: ${data.examDate || '—'}`,
      `هل اختبرت سابقًا؟ ${data.tookBefore || '—'}${data.prevScore ? ` — الدرجة السابقة: ${data.prevScore}` : ''}`,
      `الدرجة المستهدفة: ${data.targetScore || '—'}`,
      `منطقة الاختبار: ${data.region || '—'}`,
      `وسيلة التواصل: ${data.contactPref || '—'}${data.contactValue ? ` — ${data.contactValue}` : ''}`,
      '',
      '—',
      'ملاحظة مهمة: سأقوم بإرفاق الإيصال هنا مرة أخرى (صورة/ملف) للتأكيد النهائي.',
      'فضلاً: لا أرسل أكثر من رسالة حتى لا يتأخر الرد علي.'
    ];
    return lines.join('\n');
  }

  function getFormData(){
    const fd = new FormData(form);
    return {
      fullName: (fd.get('fullName') || '').toString().trim(),
      phone: (fd.get('phone') || '').toString().trim(),
      examDate: (fd.get('examDate') || '').toString().trim(),
      tookBefore: (fd.get('tookBefore') || '').toString().trim(),
      prevScore: (fd.get('prevScore') || '').toString().trim(),
      targetScore: (fd.get('targetScore') || '').toString().trim(),
      region: (fd.get('region') || '').toString().trim(),
      contactPref: (fd.get('contactPref') || '').toString().trim(),
      contactValue: (fd.get('contactValue') || '').toString().trim(),
      notes: (fd.get('notes') || '').toString().trim(),
      receipt: fd.get('receipt'),
      pledge1: fd.get('pledge1') === 'on',
      pledge2: fd.get('pledge2') === 'on',
      pledge3: fd.get('pledge3') === 'on',
    };
  }

  function validate(data){
    const errors = [];
    if (!data.fullName) errors.push('اكتب الاسم الثلاثي.');
    if (!data.examDate) errors.push('حدد موعد الاختبار (أو اختر: لسا ما حجزت).');
    if (!data.targetScore) errors.push('حدد الدرجة المستهدفة.');
    const fileOk = data.receipt && typeof data.receipt === 'object' && data.receipt.size > 0;
    if (!fileOk) errors.push('رفع الإيصال إلزامي (صورة أو PDF).');
    if (!data.pledge1 || !data.pledge2 || !data.pledge3) errors.push('فعّل جميع التعهدات.');
    return errors;
  }

  const outBox = $('#telegramOut');
  const outText = $('#telegramText');
  const openBtn = $('#openTelegram');
  const copyMsgBtn = $('#copyTelegram');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = getFormData();
      const errors = validate(data);
      const errBox = $('#regErrors');
      if (errBox) errBox.innerHTML = '';

      if (errors.length) {
        if (errBox) {
          errBox.innerHTML = errors.map(x => `<div class="pill danger">${x}</div>`).join('');
        }
        window.scrollTo({top: 0, behavior:'smooth'});
        return;
      }

      // Save profile lightly
      const profile = {
        fullName: data.fullName,
        examDate: data.examDate,
        tookBefore: data.tookBefore,
        prevScore: data.prevScore,
        targetScore: data.targetScore,
        region: data.region,
        contactPref: data.contactPref,
        contactValue: data.contactValue,
      };
      localStorage.setItem(STORAGE.profileKey, JSON.stringify(profile));

      const msg = buildTelegramMessage(data) + (data.notes ? `\n\nملاحظات إضافية: ${data.notes}` : '');
      if (outText) outText.value = msg;
      if (outBox) outBox.classList.remove('hidden');

      const handle = CONFIG.telegramHandle;
      const tgUrl = `https://t.me/${handle}?text=${encodeURIComponent(msg)}`;
      if (openBtn) openBtn.setAttribute('href', tgUrl);

      if (copyMsgBtn) {
        copyMsgBtn.onclick = async () => {
          try{
            await navigator.clipboard.writeText(msg);
            copyMsgBtn.textContent = 'تم النسخ ✅';
            setTimeout(() => copyMsgBtn.textContent = 'نسخ الرسالة', 1200);
          }catch(_){ copyMsgBtn.textContent = 'انسخ يدويًا'; }
        };
      }

      // Friendly note
      const note = $('#afterSubmitNote');
      if (note) note.classList.remove('hidden');

      outBox.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }
})();
