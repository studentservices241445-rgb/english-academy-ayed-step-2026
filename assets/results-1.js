/* Results page: render analysis + plan + unlock price section */

(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const {STORAGE, CONFIG} = window.AYED;

  function loadResult(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE.resultKey) || 'null');
    }catch(_){ return null; }
  }
  function loadProfile(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE.profileKey) || 'null');
    }catch(_){ return null; }
  }

  const result = loadResult();
  const profile = loadProfile();

  const gate = $('#needTest');
  const wrap = $('#resultsWrap');

  if (!result || !profile){
    wrap?.classList.add('hidden');
    gate?.classList.remove('hidden');
    return;
  }

  // ===== summary numbers =====
  $('#scoreOverall').textContent = Math.round(result.overallPercent);
  $('#scoreCorrect').textContent = `${result.correctCount}/${result.total}`;
  $('#scoreTime').textContent = `${Math.round(result.durationSec/60)} دقيقة`;

  const sections = ['grammar','reading','listening','vocab'];
  const sectionLabels = {
    grammar:'Grammar', reading:'Reading', listening:'Listening', vocab:'Vocabulary'
  };

  // bars
  const bars = $('#sectionBars');
  bars.innerHTML = '';
  for (const sec of sections){
    const p = Math.round(result.sectionBreakdown?.[sec] || 0);
    const row = document.createElement('div');
    row.className = 'barRow';
    row.innerHTML = `
      <div class="label">${sectionLabels[sec]}</div>
      <div class="bar"><span style="width:${p}%"></span></div>
      <div class="pct">${p}%</div>
    `;
    bars.appendChild(row);
  }

  // strengths / weaknesses
  const ranked = sections
    .map(s => ({s, p: Number(result.sectionBreakdown?.[s] || 0)}))
    .sort((a,b)=>b.p-a.p);

  const strong = ranked.slice(0,2).filter(x=>x.p>0);
  const weak = ranked.slice(-2).sort((a,b)=>a.p-b.p);

  $('#strengths').innerHTML = strong.map(x=>`<li><strong>${sectionLabels[x.s]}</strong> — ${Math.round(x.p)}%</li>`).join('') || '<li>نحتاج بيانات أكثر…</li>';
  $('#weaknesses').innerHTML = weak.map(x=>`<li><strong>${sectionLabels[x.s]}</strong> — ${Math.round(x.p)}%</li>`).join('') || '<li>تمام — ما عندك قسم منخفض بشكل واضح.</li>';

  // top skill gaps
  const skillList = $('#skillGaps');
  const skills = Object.entries(result.skillGaps || {})
    .map(([k,v]) => ({k, v}))
    .sort((a,b)=>b.v-a.v)
    .slice(0,3);

  const skillNames = {
    conditionals:'الشرطيات', agreement:'تطابق الفاعل والفعل', prepositions:'حروف الجر', articles:'أدوات التعريف',
    comparatives:'المقارنات', pronouns:'الضمائر', modals:'الأفعال الناقصة', gerunds:'Gerund', infinitives:'Infinitive',
    relative_clauses:'Relative Clauses', tenses:'الأزمنة', main_idea:'الفكرة الرئيسية', detail:'التفاصيل',
    inference:'الاستنتاج', vocab_in_context:'معاني من السياق', vocab_meaning:'معاني المفردات',
    time:'إدارة الوقت', strategy:'استراتيجية الحل', purpose:'الغرض'
  };

  skillList.innerHTML = skills.length
    ? skills.map(s=>`<li><strong>${skillNames[s.k] || s.k}</strong> — أخطاء: ${s.v}</li>`).join('')
    : '<li>ممتاز… ما عندك نمط أخطاء واضح 👌</li>';

  // show mistakes (short list)
  const mistakesWrap = $('#mistakes');
  mistakesWrap.innerHTML = '';
  (result.mistakes || []).slice(0,8).forEach(m => {
    const item = document.createElement('div');
    item.className = 'mistake';
    item.innerHTML = `
      <div class="mQ"><strong>سؤال ${m.questionId}</strong> — ${escapeHtml(m.question).slice(0,120)}${m.question.length>120?'…':''}</div>
      <div class="mA"><span class="bad">إجابتك:</span> ${escapeHtml(m.your)}</div>
      <div class="mC"><span class="ok">الصحيح:</span> ${escapeHtml(m.correct)}</div>
      <div class="mE">${escapeHtml(m.explanation)}</div>
    `;
    mistakesWrap.appendChild(item);
  });

  // ===== Plan generation =====
  const plan = makePlan(profile, ranked);
  $('#planTitle').textContent = plan.title;
  $('#planIntro').textContent = plan.intro;

  const planDays = $('#planDays');
  planDays.innerHTML = plan.days.map(d => {
    const bullets = d.items.map(i=>`<li>${escapeHtml(i)}</li>`).join('');
    return `
      <details class="accordion" ${d.open?'open':''}>
        <summary>
          <span>${escapeHtml(d.day)}</span>
          <span class="tag">${escapeHtml(d.focus)}</span>
        </summary>
        <div class="accBody">
          <ul>${bullets}</ul>
        </div>
      </details>
    `;
  }).join('');

  // Unlock price box (this page only) after plan is rendered
  const priceBox = $('#priceBox');
  priceBox.classList.remove('hidden');
  $('#priceNow').textContent = CONFIG.priceNow;
  $('#priceOfficial').textContent = CONFIG.priceOfficial;
  $('#seatsLeft').textContent = CONFIG.seatsLeft;

  // Handy actions
  $('#btnToRegister').addEventListener('click', () => {
    window.location.href = './register.html';
  });
  $('#btnReset').addEventListener('click', () => {
    localStorage.removeItem(STORAGE.completedKey);
    localStorage.removeItem(STORAGE.resultKey);
    localStorage.removeItem(STORAGE.profileKey);
    window.location.href = './level-test.html';
  });

  function makePlan(profile, ranked){
    const when = String(profile.examWhen || 'month');
    const hours = Number(profile.hoursPerDay || 2);

    // Choose template length
    let template;
    if (when.includes('7')) template = 7;
    else if (when.includes('14')) template = 14;
    else if (when.includes('30')) template = 30;
    else template = 60;

    const weakSections = ranked.slice(-2).map(x=>x.s);
    const weakMain = weakSections[0];

    const focusLabel = {
      grammar:'Grammar', reading:'Reading', listening:'Listening', vocab:'Vocabulary'
    };

    const base = {
      7: {
        title: 'خطة 7 أيام — إنقاذ ذكي (اختبار قريب جدًا)',
        intro: 'هذه الخطة تركّز على التكنيكات + نماذج مركزة + مراجعة أخطاء. لا نفتح مصادر زيادة — نلتزم بخطة واحدة.',
      },
      14: {
        title: 'خطة 14 يوم — تأسيس سريع + تطبيق يومي',
        intro: 'نرفع الأساسيات بسرعة، ثم نطبّق يوميًا ونقفل دائرة الأخطاء. أهم شيء: الالتزام.',
      },
      30: {
        title: 'خطة 30 يوم — تأسيس + تعميق + رفع سرعة',
        intro: 'أهدأ من خطط الأسبوعين، لكنها أقوى في تثبيت العادات ورفع السرعة تدريجيًا.',
      },
      60: {
        title: 'خطة 45–60 يوم — تأسيس هادئ + توزيع + اختبارات أسبوعية',
        intro: 'أفضل خيار إذا تبغى نتيجة قوية بدون ضغط آخر لحظة. كل أسبوع اختبار تجريبي + تحليل أخطاء.',
      },
    }[template];

    const dayBlocks = [];
    const dailyMinutes = Math.max(60, Math.min(240, hours * 60));

    function block(day, focus, items, open=false){
      dayBlocks.push({day, focus, items, open});
    }

    // Quick helper
    const common = [
      `زمن مذاكرتك اليومي المقترح: ${dailyMinutes} دقيقة (قسّمها 3 جلسات).`,
      'في نهاية اليوم: اكتب 3 أخطاء تكررت معك + حل 5 أسئلة مشابهة.',
    ];

    // Build plan based on template
    if (template === 7){
      block('اليوم 1–2', focusLabel[weakMain], [
        ...common,
        `ركّز على ${focusLabel[weakMain]} فقط: تكنيكات + أسئلة قصيرة (20–30).`,
        'استخدم قاعدة: جواب بسرعة ثم راجع الأخطاء (بدون جلد ذات).',
      ], true);
      block('اليوم 3', 'Reading + Vocabulary', [
        ...common,
        'قراءة: 2 قطع + أسئلة (توقيت).',
        'مفردات: 20 كلمة (مع أمثلة) + اختبار سريع.',
      ]);
      block('اليوم 4', 'Grammar', [
        ...common,
        'مراجعة قواعد أساسية + أسئلة تكنيكات.',
        'لا تحفظ قواعد بشكل نظري… خلك على أمثلة وأسئلة.',
      ]);
      block('اليوم 5', 'Listening', [
        ...common,
        'Listening: تدريب 20–30 دقيقة + أسئلة فهم.',
        'بعد كل سؤال: ليه اخترت؟ وليه الصحيح؟',
      ]);
      block('اليوم 6', 'نماذج تجريبية', [
        ...common,
        'نموذج تجريبي كامل (توقيت حقيقي).',
        'تحليل أخطاء فقط… بدون مصادر جديدة.',
      ]);
      block('اليوم 7', 'مراجعة أخطاء فقط', [
        ...common,
        'راجع قائمة الأخطاء + أعلى 3 مهارات تحتاج شغل.',
        'نمذجة سريعة 30–40 سؤال من نقاط ضعفك.',
      ]);
    } else if (template === 14){
      block('الأيام 1–3', `تركيز ${focusLabel[weakMain]}`, [
        ...common,
        `أساسيات ${focusLabel[weakMain]} + 25 سؤال يوميًا.`,
        'هدفك: تثبيت التكنيكات + تقليل الأخطاء المتكررة.',
      ], true);
      block('الأيام 4–6', 'Reading + Vocabulary', [
        ...common,
        'Reading: 3 قطع يوميًا (بالتوقيت) + تحليل.',
        'Vocabulary: 25 كلمة يوميًا + مراجعة متباعدة.',
      ]);
      block('الأيام 7–9', 'Grammar + مراجعات قصيرة', [
        ...common,
        'Grammar: مراجعة قواعد + نماذج قصيرة.',
        'نهاية كل يوم: 15 سؤال سريع (سرعة + دقة).',
      ]);
      block('الأيام 10–11', 'Listening يومي', [
        ...common,
        'Listening: 30 دقيقة + أسئلة متنوعة.',
        'ركز على فهم الفكرة الرئيسية + تفاصيل مهمة.',
      ]);
      block('اليوم 12', 'نموذج تجريبي', [
        ...common,
        'نموذج كامل (توقيت).',
        'بعده: اكتب “قائمة أخطاء” — هذه كنزك.',
      ]);
      block('اليوم 13–14', 'مراجعة مركزة', [
        ...common,
        `رجّع تركيزك على ${focusLabel[weakMain]} + أعلى مهارتين أخطاء.`,
        'بدون مصادر جديدة — فقط مراجعة + حل.',
      ]);
    } else if (template === 30){
      block('الأسبوع 1', `تأسيس + ${focusLabel[weakMain]}`, [
        ...common,
        'قسّم الأسبوع: 3 أيام نقطة ضعفك + يومين Reading + يوم Listening + يوم مراجعة.',
        `في أيام ${focusLabel[weakMain]}: 30–40 سؤال + تصحيح.`
      ], true);
      block('الأسبوع 2', 'رفع سرعة Reading', [
        ...common,
        'Reading: 4 قطع على مدار الأسبوع بتوقيت صارم.',
        'Vocabulary: 15–20 كلمة يوميًا + مراجعة.'
      ]);
      block('الأسبوع 3', 'نماذج + تحليل أخطاء', [
        ...common,
        'نموذج تجريبي كل 3 أيام.',
        'بعد كل نموذج: خطة إصلاح لأكثر 5 أخطاء.'
      ]);
      block('الأسبوع 4', 'تثبيت + مراجعة نهائية', [
        ...common,
        'خفف مصادر… زِد مراجعة الأخطاء.',
        `ركّز على ${focusLabel[weakMain]} + Listening يومي 20 دقيقة.`,
      ]);
    } else {
      block('الأسبوع 1–2', 'تأسيس هادئ', [
        ...common,
        'ابدأ بتأسيس Grammar + Vocabulary (تدريجي).',
        'Reading يوم بعد يوم بقطع قصيرة.',
      ], true);
      block('الأسبوع 3–4', `تعميق ${focusLabel[weakMain]}`, [
        ...common,
        `ثبّت نقاط ضعفك في ${focusLabel[weakMain]}: نماذج + مراجعة أخطاء.`,
        'Listening يومي 20–30 دقيقة.'
      ]);
      block('الأسبوع 5–6', 'اختبارات تجريبية أسبوعية', [
        ...common,
        'اختبار تجريبي أسبوعيًا + تحليل تفصيلي.',
        'استهدف “تقليل الأخطاء المتكررة” وليس “حل أكثر”.'
      ]);
      block('آخر 7–10 أيام', 'مراجعة مركزة', [
        ...common,
        'مراجعة الأخطاء + تكنيكات + نماذج قصيرة.',
        'أوقف أي مصدر جديد — الآن وقت التثبيت.'
      ]);
    }

    // Adjust note based on weak sections
    const addNote = $('#planNote');
    addNote.textContent = `ملاحظة: بناءً على نتيجتك، أعلى تركيز عندك يكون على: ${weakSections.map(s=>focusLabel[s]).join(' ثم ')}.`;

    return { ...base, days: dayBlocks };
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }
})();
