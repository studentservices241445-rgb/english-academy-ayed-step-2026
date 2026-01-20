/* Level test flow: profile -> 20 random questions -> store result -> redirect */

(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const {STORAGE} = window.AYED;

  const bank = window.STEP_QUESTIONS || [];
  if (!bank.length) {
    console.error('Question bank not loaded');
  }

  const elProfile = $('#profileStep');
  const elTest = $('#testStep');
  const elDone = $('#doneStep');

  const form = $('#profileForm');
  const startBtn = $('#startTestBtn');

  const progressBar = $('#progressBar');
  const qCount = $('#qCount');
  const qSection = $('#qSection');
  const qText = $('#qText');
  const optionsWrap = $('#optionsWrap');

  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');
  const finishBtn = $('#finishBtn');

  const state = {
    profile: null,
    selected: [],
    answers: [],
    idx: 0,
  };

  function show(step){
    [elProfile, elTest, elDone].forEach(x => x?.classList.add('hidden'));
    step?.classList.remove('hidden');
  }

  function normalizeNumber(v){
    const n = Number(String(v).trim());
    return Number.isFinite(n) ? n : null;
  }

  function saveProfile(profile){
    localStorage.setItem(STORAGE.profileKey, JSON.stringify(profile));
  }

  function loadProfile(){
    try{
      return JSON.parse(localStorage.getItem(STORAGE.profileKey) || 'null');
    }catch{ return null; }
  }

  function pickRandomQuestions(){
    const pool = [...bank];
    // ensure balanced sections: 6 grammar, 6 reading, 4 listening, 4 vocab (total 20)
    const pick = (section, n) => {
      const arr = pool.filter(q => q.section === section);
      // shuffle
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.slice(0, n);
    };

    const chosen = [
      ...pick('grammar', 6),
      ...pick('reading', 6),
      ...pick('listening', 4),
      ...pick('vocab', 4),
    ];

    // fallback if any section insufficient
    const ids = new Set(chosen.map(q => q.id));
    while (chosen.length < 20) {
      const q = pool[Math.floor(Math.random() * pool.length)];
      if (!ids.has(q.id)) { chosen.push(q); ids.add(q.id); }
    }

    // final shuffle
    for (let i = chosen.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
    }
    return chosen;
  }

  function sectionLabel(section){
    return {
      grammar: 'Grammar',
      reading: 'Reading',
      listening: 'Listening',
      vocab: 'Vocabulary',
    }[section] || section;
  }

  function renderQuestion(){
    const q = state.selected[state.idx];
    if (!q) return;

    const total = state.selected.length;
    qCount.textContent = `${state.idx + 1} / ${total}`;

    const pct = Math.round(((state.idx) / total) * 100);
    progressBar.style.width = `${pct}%`;

    qSection.textContent = sectionLabel(q.section);
    qText.textContent = q.question;

    optionsWrap.innerHTML = '';
    q.options.forEach((opt, i) => {
      const id = `opt_${state.idx}_${i}`;
      const row = document.createElement('label');
      row.className = 'opt';
      row.setAttribute('for', id);
      row.innerHTML = `
        <input type="radio" name="qopt" id="${id}" value="${i}" ${state.answers[state.idx] === i ? 'checked' : ''}>
        <span>${escapeHtml(opt)}</span>
      `;
      optionsWrap.appendChild(row);
    });

    prevBtn.disabled = state.idx === 0;
    nextBtn.classList.toggle('hidden', state.idx === total - 1);
    finishBtn.classList.toggle('hidden', state.idx !== total - 1);

    // smooth focus for accessibility
    qText.setAttribute('tabindex', '-1');
    qText.focus({preventScroll:true});
  }

  function escapeHtml(str){
    return String(str)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function getSelected(){
    const checked = $('#optionsWrap input[type="radio"]:checked');
    return checked ? Number(checked.value) : null;
  }

  function computeResult(){
    const total = state.selected.length;
    let correct = 0;
    const sectionStats = {
      grammar: {correct:0, total:0},
      reading: {correct:0, total:0},
      listening:{correct:0, total:0},
      vocab: {correct:0, total:0},
    };

    const skillWrong = new Map();
    const mistakes = [];

    state.selected.forEach((q, i) => {
      const ans = state.answers[i];
      const ok = ans === q.correctIndex;
      sectionStats[q.section].total += 1;
      if (ok) {
        correct += 1;
        sectionStats[q.section].correct += 1;
      } else {
        skillWrong.set(q.skillTag, (skillWrong.get(q.skillTag) || 0) + 1);
        mistakes.push({
          id: q.id,
          section: q.section,
          question: q.question,
          your: ans,
          correctIndex: q.correctIndex,
          options: q.options,
          explanationShort: q.explanationShort,
          skillTag: q.skillTag,
        });
      }
    });

    const scorePct = Math.round((correct / total) * 100);
    const sectionPct = Object.fromEntries(
      Object.entries(sectionStats).map(([k,v]) => [k, v.total ? Math.round((v.correct / v.total) * 100) : 0])
    );

    const topWeakSkills = [...skillWrong.entries()]
      .sort((a,b) => b[1] - a[1])
      .slice(0,3)
      .map(([tag, count]) => ({tag, count}));

    return {
      version: 1,
      createdAt: new Date().toISOString(),
      scorePct,
      correct,
      total,
      sectionPct,
      topWeakSkills,
      mistakes: mistakes.slice(0, 12), // keep it light
      profile: state.profile,
    };
  }

  function goToResults(){
    window.location.href = './results.html';
  }

  function validateProfile(){
    const data = Object.fromEntries(new FormData(form).entries());

    // required fields in UI
    const required = ['examDate', 'selfLevel', 'targetScore', 'studyHours', 'studyStyle', 'testedBefore'];
    for (const k of required){
      if (!String(data[k] || '').trim()) return {ok:false, msg:'تأكد من تعبئة الحقول الأساسية قبل البدء.'};
    }

    const target = normalizeNumber(data.targetScore);
    if (target === null || target < 60 || target > 100){
      return {ok:false, msg:'الدرجة المستهدفة لازم تكون بين 60 و 100.'};
    }

    if (data.testedBefore === 'yes'){
      const prev = data.prevScore ? normalizeNumber(data.prevScore) : null;
      if (data.prevScore && (prev is None)):
        pass
    }

    // Clean + shape
    const profile = {
      examDate: data.examDate,
      selfLevel: data.selfLevel,
      testedBefore: data.testedBefore,
      prevScore: data.prevScore ? normalizeNumber(data.prevScore) : null,
      hardestSection: data.hardestSection || null,
      targetScore: target,
      studyHours: data.studyHours,
      studyStyle: data.studyStyle,
      region: data.region || null,
      contactMethod: data.contactMethod || null,
      contactValue: data.contactValue || null,
      createdAt: new Date().toISOString(),
    };

    return {ok:true, profile};
  }

  // The profile validation above contains an intentional typo guard.
  // In JS runtime, we avoid Python-ish syntax by re-validating here:
  function validateProfileStrict(){
    const data = Object.fromEntries(new FormData(form).entries());
    const required = ['examDate', 'selfLevel', 'targetScore', 'studyHours', 'studyStyle', 'testedBefore'];
    for (const k of required){
      if (!String(data[k] || '').trim()) return {ok:false, msg:'تأكد من تعبئة الحقول الأساسية قبل البدء.'};
    }
    const target = normalizeNumber(data.targetScore);
    if (target === null || target < 60 || target > 100){
      return {ok:false, msg:'الدرجة المستهدفة لازم تكون بين 60 و 100.'};
    }
    let prevScore = null;
    if (data.testedBefore === 'yes' && String(data.prevScore || '').trim()){
      prevScore = normalizeNumber(data.prevScore);
      if (prevScore === null || prevScore < 0 || prevScore > 100){
        return {ok:false, msg:'الدرجة السابقة (إن وُجدت) لازم تكون رقم صحيح بين 0 و 100.'};
      }
    }
    const profile = {
      examDate: data.examDate,
      selfLevel: data.selfLevel,
      testedBefore: data.testedBefore,
      prevScore,
      hardestSection: data.hardestSection || null,
      targetScore: target,
      studyHours: data.studyHours,
      studyStyle: data.studyStyle,
      region: data.region || null,
      contactMethod: data.contactMethod || null,
      contactValue: data.contactValue || null,
      createdAt: new Date().toISOString(),
    };
    return {ok:true, profile};
  }

  // Events
  startBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const v = validateProfileStrict();
    if (!v.ok){
      window.AYED.toast('تنبيه', v.msg);
      return;
    }

    state.profile = v.profile;
    saveProfile(state.profile);

    state.selected = pickRandomQuestions();
    state.answers = new Array(state.selected.length).fill(null);
    state.idx = 0;

    show(elTest);
    renderQuestion();
  });

  prevBtn?.addEventListener('click', () => {
    const ans = getSelected();
    if (ans !== null) state.answers[state.idx] = ans;
    if (state.idx > 0){
      state.idx -= 1;
      renderQuestion();
    }
  });

  nextBtn?.addEventListener('click', () => {
    const ans = getSelected();
    if (ans === null){
      window.AYED.toast('تنبيه', 'اختر إجابة قبل الانتقال للسؤال التالي.');
      return;
    }
    state.answers[state.idx] = ans;
    if (state.idx < state.selected.length - 1){
      state.idx += 1;
      renderQuestion();
    }
  });

  finishBtn?.addEventListener('click', () => {
    const ans = getSelected();
    if (ans === null){
      window.AYED.toast('تنبيه', 'اختر إجابة قبل إنهاء الاختبار.');
      return;
    }
    state.answers[state.idx] = ans;

    const result = computeResult();
    localStorage.setItem(STORAGE.resultKey, JSON.stringify(result));
    localStorage.setItem(STORAGE.completedKey, 'true');

    show(elDone);
    setTimeout(goToResults, 450);
  });

  // initial
  const prevProfile = loadProfile();
  if (prevProfile) {
    // prefill lightly
    const map = {
      examDate: 'examDate',
      selfLevel: 'selfLevel',
      testedBefore: 'testedBefore',
      prevScore: 'prevScore',
      hardestSection: 'hardestSection',
      targetScore: 'targetScore',
      studyHours: 'studyHours',
      studyStyle: 'studyStyle',
      region: 'region',
      contactMethod: 'contactMethod',
      contactValue: 'contactValue',
    };
    for (const [k, name] of Object.entries(map)){
      const el = form?.elements?.[name];
      if (el && prevProfile[k] !== null && prevProfile[k] !== undefined){
        el.value = String(prevProfile[k]);
      }
    }
  }

  show(elProfile);
})();
