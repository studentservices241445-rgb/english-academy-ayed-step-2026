/* assets/test.js
   اختبار تحديد المستوى (STEP) — سؤال بعد سؤال
   - يبدأ بصفحة معلومات سريعة (بيانات الطالب + موعد الاختبار + وقت المذاكرة + الهدف)
   - يسحب بنك الأسئلة من ./assets/questions.json
   - يختار 20 سؤال عشوائي من أصل 150 (وتتغير كل مرة)
   - يعرض سؤال واحد في كل خطوة + شريط تقدم
   - يحفظ النتائج + الأخطاء + خطة مقترحة في localStorage
   - ثم يحول المستخدم إلى results.html
*/

(() => {
  "use strict";

  // ====== إعدادات عامة ======
  const QUESTIONS_URL = "./assets/questions.json";
  const STORAGE_KEY = "ayedTestResult";
  const TEST_VERSION = "2026-01-20";
  const PICK_COUNT = 20; // ✅ المطلوب: اختبار عشوائي 20 سؤال

  // أقسام الاختبار (تقدر تضيف/تعدل بدون ما ينكسر)
  const SECTIONS = [
    { key: "grammar", label: "Grammar (قواعد)" },
    { key: "reading", label: "Reading (فهم مقروء)" },
    { key: "listening", label: "Listening (استماع)" },
    { key: "vocab", label: "Vocabulary (مفردات)" },
  ];

  // ====== Helpers ======
  const $ = (sel, root = document) => root.querySelector(sel);

  function safeEl(idList) {
    for (const sel of idList) {
      const el = $(sel);
      if (el) return el;
    }
    return null;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function daysUntil(dateStr) {
    // dateStr: YYYY-MM-DD
    if (!dateStr) return null;
    const d = new Date(dateStr + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    const t = d.getTime() - Date.now();
    return Math.ceil(t / (1000 * 60 * 60 * 24));
  }

  function shuffle(arr) {
    // Fisher–Yates
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const r = getRandInt(i + 1);
      [a[i], a[r]] = [a[r], a[i]];
    }
    return a;
  }

  function getRandInt(maxExclusive) {
    // crypto إن توفر، وإلا Math.random
    if (window.crypto && crypto.getRandomValues) {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] % maxExclusive;
    }
    return Math.floor(Math.random() * maxExclusive);
  }

  function pickRandomUnique(list, n) {
    const shuffled = shuffle(list);
    return shuffled.slice(0, n);
  }

  function htmlEscape(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function toast(msg, type = "info") {
    if (typeof window.showToast === "function") {
      window.showToast(msg, type);
      return;
    }
    // fallback بسيط
    let wrap = $("#toasts");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = "toasts";
      wrap.className = "toast-wrap";
      wrap.setAttribute("aria-live", "polite");
      document.body.appendChild(wrap);
    }
    const t = document.createElement("div");
    t.className = `toast toast--${type}`;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.classList.add("is-in"), 10);
    setTimeout(() => {
      t.classList.remove("is-in");
      setTimeout(() => t.remove(), 250);
    }, 2600);
  }

  function normalizeSection(raw) {
    const s = String(raw || "").toLowerCase().trim();
    if (!s) return "grammar"; // افتراضي
    if (s.includes("gram")) return "grammar";
    if (s.includes("read")) return "reading";
    if (s.includes("listen")) return "listening";
    if (s.includes("vocab") || s.includes("word")) return "vocab";
    // لو جا "Vocabulary" أو "Vocab"
    if (s === "v") return "vocab";
    return s;
  }

  function normalizeCorrectIndex(q) {
    // يدعم صيغ مختلفة داخل questions.json
    // 1) correctIndex
    if (Number.isInteger(q.correctIndex)) return q.correctIndex;

    // 2) answerIndex
    if (Number.isInteger(q.answerIndex)) return q.answerIndex;

    // 3) correct (حرف A/B/C/D أو قيمة نصية)
    if (typeof q.correct === "string") {
      const c = q.correct.trim().toUpperCase();
      const map = { A: 0, B: 1, C: 2, D: 3, E: 4 };
      if (c in map) return map[c];
    }

    // 4) answer (حرف أو رقم)
    if (typeof q.answer === "string") {
      const a = q.answer.trim().toUpperCase();
      const map = { A: 0, B: 1, C: 2, D: 3, E: 4 };
      if (a in map) return map[a];
      const asNum = Number(a);
      if (Number.isFinite(asNum)) return asNum;
    }
    if (Number.isInteger(q.answer)) return q.answer;

    return 0;
  }

  function normalizeOptions(q) {
    // options أو choices
    const opts = Array.isArray(q.options) ? q.options
      : Array.isArray(q.choices) ? q.choices
      : Array.isArray(q.answers) ? q.answers
      : [];
    return opts.map(String);
  }

  function normalizePrompt(q) {
    return String(q.prompt || q.question || q.text || "").trim();
  }

  function normalizeExplanation(q) {
    return String(q.explanation || q.rationale || q.solution || "").trim();
  }

  function safeSaveResult(obj) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ====== توليد خطة “مقنعة” حسب البيانات + الضعف ======
  function buildPlan({ profile, score, sectionStats, wrongList }) {
    const dLeft = daysUntil(profile.examDate);
    const mins = Number(profile.dailyMinutes || 60);
    const target = Number(profile.targetScore || 85);

    // ترتيب الأقسام حسب الضعف
    const ranked = Object.values(sectionStats)
      .sort((a, b) => (a.accuracy - b.accuracy));

    const weakest = ranked[0];
    const second = ranked[1];

    const plan = [];
    const reasons = [];

    // لهجة سعودية مطمئنة بدون مبالغة
    reasons.push(`نتيجتك الحالية تعطي صورة واضحة عن مستوى كل قسم، والهدف الآن: “نشتغل بذكاء مو بكثرة مصادر”.`);
    reasons.push(`بنمشي بخطة قصيرة وواضحة داخل الدورة نفسها: شرح → تدريب → نماذج → مراجعة مركزة.`);

    // مسار حسب قرب الاختبار
    if (dLeft !== null) {
      if (dLeft <= 3) {
        plan.push(`🔥 لأن اختبارك قريب جدًا (${dLeft} يوم/أيام): ركّز 70% على “النماذج الأحدث + التجميعات” و30% مراجعة نقاطك الضعيفة بسرعة.`);
      } else if (dLeft <= 7) {
        plan.push(`⏳ بما أن اختبارك خلال أسبوع تقريبًا (${dLeft} يوم): نخلي الخطة “مكثفة لكن مرتّبة”: يوميًا نماذج + تصحيح أخطاء + مراجعة قواعد/قطع مهمة.`);
      } else if (dLeft <= 14) {
        plan.push(`🗓️ قدامك أسبوعين تقريبًا (${dLeft} يوم): ممتاز—نقدر نقفل الأساسيات أول، وبعدها نماذج على دفعات مع تحليل الأخطاء.`);
      } else {
        plan.push(`✅ قدامك وقت كويس (${dLeft} يوم): هذا أفضل سيناريو—نرفع مستواك تدريجيًا بدون ضغط، ونخلي آخر أسبوعين كلها نماذج وتثبيت.`);
      }
    } else {
      plan.push(`🗓️ بما أنك ما حددت موعد دقيق، بنبني لك خطة “مرنة”: تثبيت الأساسيات ثم نماذج وتكرار حسب تطورك.`);
    }

    // توزيع وقت يومي
    const hours = Math.max(0.5, mins / 60);
    plan.push(`⏱️ وقتك اليومي: تقريبًا ${hours.toFixed(1)} ساعة. نقسمها كذا:`);
    plan.push(`- 40% على أضعف قسم عندك (${weakest.label}).`);
    plan.push(`- 30% على ثاني أضعف قسم (${second?.label || "القسم التالي"}).`);
    plan.push(`- 30% نماذج ومراجعة أخطاء + تثبيت.`);

    // بناء توصيات داخل الدورة
    plan.push(`\n📌 “وش تسوي داخل الدورة بالضبط؟”`);
    plan.push(`1) ابدأ بالمحاضرات التمهيدية (تأسيس سريع) إذا حسيت الأساس عندك مهزوز.`);
    plan.push(`2) ادخل مباشرة على قسم ${weakest.label}: شرح النقطة → حل تدريب → راجع الحلول.`);
    plan.push(`3) بعد كل نموذج/كويز: سجّل أخطاءك (وش السبب؟ قاعدة؟ كلمة؟ فهم سؤال؟) وارجع لنفس الدرس.`);
    plan.push(`4) يوميًا (حتى لو 20 دقيقة): مراجعة كلمات/مرادفات + تكنيكات القراءة/الاستماع.`);

    // نقاط ضعف من الأخطاء (ملخص)
    if (wrongList.length) {
      const sample = wrongList.slice(0, 4).map(w => `- ${w.sectionLabel}: ${w.prompt.slice(0, 70)}...`);
      plan.push(`\n🧩 عينات من أخطاءك (عشان تعرف وين تركز):\n${sample.join("\n")}`);
      plan.push(`\n✅ ملاحظة: الخطة الكاملة بتطلع لك بالنتائج بتفصيل أكثر مع توجيه لكل قسم.`);
    }

    // هدف الطالب
    plan.push(`\n🎯 هدفك: ${target}% — وهذا الهدف ممكن جدًا إذا التزمت بالخطة بدون تشتت.`);

    return {
      summary: [
        `خلاص… الآن عندنا صورة واضحة ✅`,
        `أقوى نقطة عندك نثبتها، وأضعف نقطة نرفعها بسرعة.`,
        `وبكذا تدخل الاختبار وأنت عارف “وش تذاكر وليش”.`,
      ].join(" "),
      bullets: plan,
      reasoning: reasons.join(" "),
    };
  }

  // ====== واجهة الاختبار ======
  function renderShell(root) {
    root.innerHTML = `
      <section class="card test-card">
        <header class="test-head">
          <div>
            <h1 class="h2">تحديد المستوى — STEP</h1>
            <p class="muted">جاوب بكل هدوء… الهدف مو “تخمين”، الهدف نعرف وين تركز داخل الدورة.</p>
          </div>
          <div class="badge">نسخة الاختبار: ${htmlEscape(TEST_VERSION)}</div>
        </header>

        <div id="testView"></div>
      </section>
    `;
    return $("#testView", root);
  }

  function renderIntro(view) {
    view.innerHTML = `
      <div class="stack">
        <div class="note">
          <h3 class="h3">قبل ما نبدأ 👇</h3>
          <p>
            هذا الاختبار هدفه يطلع لك <b>خطة مذاكرة</b> على قد وقتك ومستواك.
            بعدها بتشوف <b>الخطة + التحليل</b> ثم يظهر لك خيار التسجيل.
          </p>
        </div>

        <form id="preForm" class="form grid-2">
          <div class="field">
            <label>اسمك</label>
            <input name="name" type="text" placeholder="مثال: شهد المالكي" autocomplete="name" required />
          </div>

          <div class="field">
            <label>موعد اختبارك</label>
            <input name="examDate" type="date" required />
          </div>

          <div class="field">
            <label>كم تقدر تذاكر يوميًا؟</label>
            <select name="dailyMinutes" required>
              <option value="">اختر…</option>
              <option value="30">30 دقيقة</option>
              <option value="45">45 دقيقة</option>
              <option value="60">ساعة</option>
              <option value="90">ساعة ونص</option>
              <option value="120">ساعتين</option>
              <option value="180">3 ساعات</option>
            </select>
          </div>

          <div class="field">
            <label>هدفك (درجة تقريبية)</label>
            <select name="targetScore" required>
              <option value="">اختر…</option>
              <option value="75">75+</option>
              <option value="85">85+</option>
              <option value="90">90+</option>
              <option value="95">95+</option>
            </select>
          </div>

          <div class="field full">
            <label>هل اختبرت STEP قبل؟</label>
            <select name="tookBefore" required>
              <option value="">اختر…</option>
              <option value="no">لا، أول مرة</option>
              <option value="yes_low">إيه، وكانت الدرجة أقل من هدفي</option>
              <option value="yes_ok">إيه، وودي أرفع الدرجة</option>
            </select>
          </div>

          <div class="actions full">
            <button type="submit" class="btn btn--primary">ابدأ الاختبار الآن</button>
            <a class="btn btn--ghost" href="./index.html">رجوع للرئيسية</a>
          </div>
        </form>

        <div class="muted small">
          ملاحظة: الأسئلة تتغير تلقائيًا كل مرة (عشان ما تحفظ نفس الأسئلة).
        </div>
      </div>
    `;
  }

  function renderQuestion(view, state) {
    const q = state.questions[state.index];
    const prog = Math.round(((state.index) / state.questions.length) * 100);
    const prog2 = Math.round(((state.index + 1) / state.questions.length) * 100);

    const opts = q.options.map((o, idx) => {
      return `
        <label class="opt">
          <input type="radio" name="opt" value="${idx}" />
          <span>${htmlEscape(o)}</span>
        </label>
      `;
    }).join("");

    view.innerHTML = `
      <div class="test-progress">
        <div class="bar"><span style="width:${prog2}%"></span></div>
        <div class="muted small">سؤال ${state.index + 1} من ${state.questions.length}</div>
      </div>

      <article class="qbox">
        <div class="qmeta">
          <span class="pill">${htmlEscape(q.sectionLabel)}</span>
          <span class="pill pill--soft">Progress: ${prog2}%</span>
        </div>

        <h3 class="qtitle">${htmlEscape(q.prompt)}</h3>

        <div class="opts">${opts}</div>

        <div class="actions">
          <button class="btn btn--primary" id="nextBtn">
            ${state.index + 1 === state.questions.length ? "عرض النتيجة والخطة" : "التالي"}
          </button>
          <button class="btn btn--ghost" id="skipBtn" type="button">تخطي (مو مستحسن)</button>
        </div>

        <div class="muted small">
          نصيحة: إذا احتّرت… خذ ثانيتين، اقرأ السؤال مرة ثانية، بعدها اختار.
        </div>
      </article>
    `;

    const nextBtn = $("#nextBtn", view);
    const skipBtn = $("#skipBtn", view);

    nextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const picked = view.querySelector("input[name='opt']:checked");
      if (!picked) {
        toast("اختر إجابة قبل ما تكمل 🙏", "warn");
        return;
      }
      const chosenIndex = Number(picked.value);
      saveAnswer(state, q, chosenIndex);
      goNext(view, state);
    });

    skipBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // نسجلها كـ null
      saveAnswer(state, q, null);
      goNext(view, state);
    });
  }

  function saveAnswer(state, q, chosenIndex) {
    const correctIndex = q.correctIndex;
    const isCorrect = chosenIndex === correctIndex;

    state.answers.push({
      id: q.id,
      section: q.section,
      sectionLabel: q.sectionLabel,
      prompt: q.prompt,
      options: q.options,
      chosenIndex,
      correctIndex,
      isCorrect,
      explanation: q.explanation || "",
    });
  }

  function goNext(view, state) {
    state.index += 1;
    if (state.index >= state.questions.length) {
      finalizeAndRedirect(state);
      return;
    }
    renderQuestion(view, state);
  }

  function computeStats(state) {
    const total = state.answers.length;
    const answered = state.answers.filter(a => a.chosenIndex !== null).length;
    const correct = state.answers.filter(a => a.isCorrect).length;
    const percent = total ? Math.round((correct / total) * 100) : 0;

    const sectionStats = {};
    for (const s of SECTIONS) {
      sectionStats[s.key] = {
        key: s.key,
        label: s.label,
        total: 0,
        correct: 0,
        accuracy: 0,
      };
    }

    for (const a of state.answers) {
      const k = a.section;
      if (!sectionStats[k]) {
        sectionStats[k] = { key: k, label: a.sectionLabel || k, total: 0, correct: 0, accuracy: 0 };
      }
      sectionStats[k].total += 1;
      if (a.isCorrect) sectionStats[k].correct += 1;
    }

    for (const k of Object.keys(sectionStats)) {
      const s = sectionStats[k];
      s.accuracy = s.total ? Math.round((s.correct / s.total) * 100) : 0;
    }

    const wrongList = state.answers
      .filter(a => a.chosenIndex !== null && !a.isCorrect)
      .map(a => ({
        id: a.id,
        section: a.section,
        sectionLabel: a.sectionLabel,
        prompt: a.prompt,
        chosenIndex: a.chosenIndex,
        correctIndex: a.correctIndex,
        chosenText: a.options[a.chosenIndex] || "",
        correctText: a.options[a.correctIndex] || "",
        explanation: a.explanation || "",
      }));

    return { total, answered, correct, percent, sectionStats, wrongList };
  }

  function finalizeAndRedirect(state) {
    const stats = computeStats(state);

    // بناء خطة
    const plan = buildPlan({
      profile: state.profile,
      score: stats.percent,
      sectionStats: stats.sectionStats,
      wrongList: stats.wrongList,
    });

    const payload = {
      version: TEST_VERSION,
      createdAt: nowISO(),
      profile: state.profile,
      pickCount: PICK_COUNT,
      bankSize: state.bankSize,
      score: {
        percent: stats.percent,
        correct: stats.correct,
        total: stats.total,
        answered: stats.answered,
      },
      sections: stats.sectionStats,
      wrong: stats.wrongList,
      answers: state.answers, // كامل الإجابات (للاستخدام في صفحة النتائج)
      planSummary: plan.summary,
      planReasoning: plan.reasoning,
      planBullets: plan.bullets,
      // نقطة مهمة: السعر ما يطلع هنا — صفحة النتائج هي اللي تظهر السعر بعد الاختبار
      gated: { showPrice: true, showRegisterCTA: true },
    };

    const ok = safeSaveResult(payload);
    if (!ok) {
      toast("صار خطأ بحفظ النتيجة… جرّب تحديث الصفحة.", "warn");
      return;
    }

    toast("تم تجهيز نتيجتك والخطة ✅", "success");

    setTimeout(() => {
      window.location.href = "./results.html";
    }, 500);
  }

  // ====== تحميل الأسئلة ======
  async function loadQuestions() {
    const res = await fetch(QUESTIONS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("تعذر تحميل بنك الأسئلة.");
    const data = await res.json();

    // قد يكون الملف Array أو {questions:[...]}
    const list = Array.isArray(data) ? data : Array.isArray(data.questions) ? data.questions : [];
    if (!list.length) throw new Error("بنك الأسئلة فاضي أو بصيغة غير مدعومة.");

    // normalize
    const normalized = list.map((q, idx) => {
      const options = normalizeOptions(q);
      const correctIndex = clamp(normalizeCorrectIndex(q), 0, Math.max(0, options.length - 1));
      const section = normalizeSection(q.section || q.category || q.part);
      const sectionLabel = (SECTIONS.find(s => s.key === section)?.label) || section;

      return {
        id: q.id || q.qid || `q_${idx + 1}`,
        section,
        sectionLabel,
        prompt: normalizePrompt(q) || `Question ${idx + 1}`,
        options,
        correctIndex,
        explanation: normalizeExplanation(q),
      };
    });

    return normalized;
  }

  // ====== تشغيل ======
  async function boot() {
    const root = safeEl(["#testApp", "#levelTestApp", "#levelTest", "main .testApp"]);
    if (!root) return;

    const view = renderShell(root);
    renderIntro(view);

    const form = $("#preForm", view);
    if (!form) return;

    let bank = [];
    try {
      bank = await loadQuestions();
    } catch (e) {
      toast(e.message || "تعذر تحميل بنك الأسئلة.", "warn");
      view.innerHTML = `
        <div class="note note--danger">
          <h3 class="h3">صار خطأ</h3>
          <p>${htmlEscape(e.message || "تعذر تحميل بنك الأسئلة.")}</p>
          <a class="btn btn--primary" href="./index.html">رجوع للرئيسية</a>
        </div>
      `;
      return;
    }

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();

      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const examDate = String(fd.get("examDate") || "").trim();
      const dailyMinutes = String(fd.get("dailyMinutes") || "").trim();
      const targetScore = String(fd.get("targetScore") || "").trim();
      const tookBefore = String(fd.get("tookBefore") || "").trim();

      if (!name || !examDate || !dailyMinutes || !targetScore || !tookBefore) {
        toast("كمّل البيانات قبل ما تبدأ 🙏", "warn");
        return;
      }

      // اختيار 20 سؤال عشوائي
      const picked = pickRandomUnique(bank, Math.min(PICK_COUNT, bank.length));

      const state = {
        profile: {
          name,
          examDate,
          dailyMinutes,
          targetScore,
          tookBefore,
        },
        bankSize: bank.length,
        questions: picked,
        answers: [],
        index: 0,
      };

      // ابدأ أول سؤال
      renderQuestion(view, state);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
