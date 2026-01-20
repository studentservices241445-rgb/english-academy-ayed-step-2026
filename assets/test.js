/* assets/test.js
   Ayed STEP Intensive 2026 - Level Test (Arabic / RTL)
   - Pre-info step -> Random 20 questions from questions.json (150 bank)
   - One question at a time with progress
   - Stores results in localStorage and redirects to results.html
*/

(() => {
  "use strict";

  const APP_ID = "testApp";
  const BANK_URL = "./assets/questions.json";
  const STORAGE_KEY = "ayed_step_leveltest_v2026_01_20";
  const LS_RESULT = `${STORAGE_KEY}:result`;
  const LS_SESSION = `${STORAGE_KEY}:session`;

  const DEFAULTS = {
    pricing: {
      discountedPriceSar: 349,
      regularPriceSar: 599,
      currency: "SAR",
      note: "السعر يظهر بعد الاختبار لأننا نبغى نطلع لك الخطة أول 👍"
    }
  };

  const $app = document.getElementById(APP_ID);
  if (!$app) return;

  const escapeHtml = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const nowISO = () => new Date().toISOString();

  function toast(message) {
    // If your site has a global toast system in app.js, it can listen to this event.
    window.dispatchEvent(new CustomEvent("ayed:toast", { detail: { message } }));
    // Fallback simple alert (quiet)
    // alert(message);
  }

  function saveSession(session) {
    try {
      localStorage.setItem(LS_SESSION, JSON.stringify(session));
    } catch (e) {}
  }

  function loadSession() {
    try {
      const raw = localStorage.getItem(LS_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveResult(result) {
    try {
      localStorage.setItem(LS_RESULT, JSON.stringify(result));
    } catch (e) {}
  }

  function pickRandom(arr, n) {
    const a = arr.slice();
    // Fisher–Yates shuffle
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, Math.min(n, a.length));
  }

  function normalizeQuestion(q, idx) {
    // Expected fields:
    // id, section, prompt, choices[], answer_index (0..), explain(optional)
    const id = q.id ?? `q${idx + 1}`;
    const section = (q.section ?? "general").toLowerCase();
    const prompt = q.prompt ?? q.question ?? "";
    const choices = Array.isArray(q.choices) ? q.choices : Array.isArray(q.options) ? q.options : [];
    const answerIndex =
      Number.isInteger(q.answer_index) ? q.answer_index :
      Number.isInteger(q.answerIndex) ? q.answerIndex :
      Number.isInteger(q.correct) ? q.correct : -1;

    const explain = q.explain ?? q.explanation ?? "";
    return { id, section, prompt, choices, answerIndex, explain };
  }

  async function loadBank() {
    const res = await fetch(BANK_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("bank_fetch_failed");
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("bank_invalid");
    return data.map(normalizeQuestion).filter(q => q.prompt && q.choices?.length >= 2 && q.answerIndex >= 0);
  }

  function daysBucketToDays(bucket) {
    // bucket values from form
    switch (bucket) {
      case "0-3": return 3;
      case "4-7": return 7;
      case "8-14": return 14;
      case "15-30": return 30;
      case "31-60": return 60;
      case "60+": return 90;
      default: return 30;
    }
  }

  function buildPlan({ daysToExam, weakOrder, profile }) {
    const days = daysToExam;
    const focus1 = weakOrder[0] ?? "grammar";
    const focus2 = weakOrder[1] ?? "reading";
    const focus3 = weakOrder[2] ?? "listening";

    const readable = (sec) => {
      if (sec === "grammar") return "القواعد (Grammar)";
      if (sec === "reading") return "القراءة (Reading)";
      if (sec === "listening") return "الاستماع (Listening)";
      if (sec === "vocab") return "المفردات (Vocabulary)";
      return "المهارات العامة";
    };

    const intensity =
      days <= 7 ? "مكثّف جدًا" :
      days <= 14 ? "مكثّف" :
      days <= 30 ? "متوازن" :
      "ممتاز ومرتاح";

    const intro =
      `تمام يا ${profile.name ? profile.name : "بطل"} ✅\n` +
      `هذي خطتك المقترحة (${intensity}) بناءً على وقت اختبارك + نتيجتك.`;

    const bullets = [];

    bullets.push(`**أولوياتك حسب نقاط الضعف:**`);
    bullets.push(`1) ${readable(focus1)}`);
    bullets.push(`2) ${readable(focus2)}`);
    bullets.push(`3) ${readable(focus3)}`);

    bullets.push(`\n**كيف تمشي داخل الدورة (بدون تشتت):**`);
    bullets.push(`- ابدأ بملف/محاضرات التأسيس السريعة (إذا مستواك مبتدئ أو رجعت بعد انقطاع).`);
    bullets.push(`- بعدها ادخل مباشرة على قسم ${readable(focus1)}: شرح → تطبيق → كويزات → نماذج.`);
    bullets.push(`- ثم ${readable(focus2)} بنفس الأسلوب: استراتيجيات → قطع تدريب → تحليل أخطاء.`);
    bullets.push(`- ثم ${readable(focus3)}: مهارات التقاط الفكرة → تدريب على أسئلة شبيهة → مراجعة.`);
    bullets.push(`- آخر مرحلة: مراجعة “المكرر” + نماذج محاكية لأسلوب قياس 2026 قدر الإمكان.`);

    if (days <= 7) {
      bullets.push(`\n**خطة 7 أيام (سريعة وواقعية):**`);
      bullets.push(`- يوم 1–2: تركيز كامل على ${readable(focus1)} + حل نماذج قصيرة`);
      bullets.push(`- يوم 3–4: ${readable(focus2)} + قطع الأكثر تكرارًا + تصحيح الأخطاء`);
      bullets.push(`- يوم 5: ${readable(focus3)} + تدريب مركز`);
      bullets.push(`- يوم 6: نموذج محاكي + مراجعة غلطاتك`);
      bullets.push(`- يوم 7: مراجعة خفيفة + تثبيت الكلمات/التكنيكات + نوم بدري 👌`);
    } else if (days <= 14) {
      bullets.push(`\n**خطة 14 يوم (مكثفة ومرتبة):**`);
      bullets.push(`- 6 أيام: ${readable(focus1)} (3 أيام شرح + 3 أيام تدريب)`);
      bullets.push(`- 5 أيام: ${readable(focus2)} (استراتيجيات + تدريب + تحليل)`);
      bullets.push(`- 2 يوم: ${readable(focus3)} (تطبيق + نماذج)`);
      bullets.push(`- يوم: نموذج شامل + مراجعة نهائية`);
    } else if (days <= 30) {
      bullets.push(`\n**خطة 30 يوم (متوازنة):**`);
      bullets.push(`- أسبوع 1: تأسيس سريع + تثبيت التكنيكات`);
      bullets.push(`- أسبوع 2: رفع مستوى ${readable(focus1)} + كويزات + نماذج`);
      bullets.push(`- أسبوع 3: ${readable(focus2)} تركيز + قراءة يومية`);
      bullets.push(`- أسبوع 4: ${readable(focus3)} + نماذج محاكية + مراجعة أخطاء`);
    } else {
      bullets.push(`\n**خطة 60–90 يوم (نتيجة قوية بإذن الله):**`);
      bullets.push(`- أول 2 أسبوع: تأسيس + جدول ثابت`);
      bullets.push(`- 4 أسابيع: تطوير الأقسام حسب ترتيب ضعفك`);
      bullets.push(`- آخر 2 أسبوع: نماذج + مراجعة المكرر + تثبيت المفردات`);
    }

    bullets.push(`\n**ملاحظة مهمة:**`);
    bullets.push(`- غلطك في الأسئلة يعطيك “خريطة طريق” — كل ما تعيد الاختبار أو تحل نماذج، راجع سبب الغلط مو بس الإجابة.`);

    const closing =
      `\n\nجاهز؟ 👇\n` +
      `الخطوة الجاية: **التسجيل وتأكيد الدفع** عشان توصلك القنوات والملفات وخطة البداية فور التأكيد.`;

    return {
      title: "خطة مذاكرة مقترحة",
      summary: intro,
      bullets,
      closing
    };
  }

  function computeScore(questions, answers) {
    let correct = 0;
    const bySection = {};
    const wrongItems = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const picked = answers[i];
      const isCorrect = picked === q.answerIndex;
      if (isCorrect) correct++;
      const sec = q.section || "general";
      bySection[sec] = bySection[sec] || { total: 0, correct: 0 };
      bySection[sec].total += 1;
      if (isCorrect) bySection[sec].correct += 1;
      if (!isCorrect) {
        wrongItems.push({
          id: q.id,
          section: sec,
          prompt: q.prompt,
          pickedIndex: picked,
          answerIndex: q.answerIndex,
          explain: q.explain || ""
        });
      }
    }

    const pct = questions.length ? Math.round((correct / questions.length) * 100) : 0;

    // Build weak order: lowest percentage first, but focus only on main STEP sections if exist
    const mainOrder = ["grammar", "reading", "listening", "vocab", "general"];
    const sections = Object.keys(bySection);
    const scoredSections = sections.map((s) => {
      const t = bySection[s].total || 1;
      const c = bySection[s].correct || 0;
      return { section: s, pct: Math.round((c / t) * 100), total: t, correct: c };
    });

    scoredSections.sort((a, b) => a.pct - b.pct);

    const weakOrder = [];
    for (const m of mainOrder) {
      const found = scoredSections.find(x => x.section === m);
      if (found) weakOrder.push(m);
    }
    // Add any others
    for (const s of scoredSections) {
      if (!weakOrder.includes(s.section)) weakOrder.push(s.section);
    }

    return { correct, total: questions.length, pct, bySection: scoredSections, weakOrder, wrongItems };
  }

  // ---------------- UI Rendering ----------------

  function renderShell() {
    $app.innerHTML = `
      <section class="card" dir="rtl" lang="ar">
        <div class="card__head">
          <h1 class="h1">اختبار تحديد المستوى</h1>
          <p class="muted">جاوب سريع… ونطلع لك خطة مذاكرة على قد وقتك ✨</p>
        </div>

        <div id="ltBody"></div>
      </section>
    `;
  }

  function renderPreForm(session) {
    const prev = session?.profile || {};
    const prevBucket = prev.daysBucket || "15-30";
    const prevTried = prev.triedBefore || "no";

    document.getElementById("ltBody").innerHTML = `
      <div class="stack">
        <div class="note">
          <strong>ليش نسوي الاختبار؟</strong><br/>
          عشان ما نضيع وقتك. نعطيك خطة واضحة: وش تركز عليه داخل الدورة وليش، حسب وقت اختبارك ونتيجتك.
          <div class="muted" style="margin-top:.5rem">ملاحظة: ما راح يظهر لك سعر الاشتراك إلا بعد ما تطلع خطتك ✅</div>
        </div>

        <form id="ltPreForm" class="form">
          <div class="grid2">
            <label class="field">
              <span>اسمك (اختياري)</span>
              <input name="name" class="input" placeholder="مثال: نورة" value="${escapeHtml(prev.name || "")}" />
            </label>

            <label class="field">
              <span>كم باقي على اختبارك؟</span>
              <select name="daysBucket" class="select">
                <option value="0-3" ${prevBucket === "0-3" ? "selected" : ""}>0–3 أيام</option>
                <option value="4-7" ${prevBucket === "4-7" ? "selected" : ""}>4–7 أيام</option>
                <option value="8-14" ${prevBucket === "8-14" ? "selected" : ""}>8–14 يوم</option>
                <option value="15-30" ${prevBucket === "15-30" ? "selected" : ""}>15–30 يوم</option>
                <option value="31-60" ${prevBucket === "31-60" ? "selected" : ""}>31–60 يوم</option>
                <option value="60+" ${prevBucket === "60+" ? "selected" : ""}>أكثر من 60 يوم</option>
              </select>
            </label>

            <label class="field">
              <span>سبق اختبرت STEP؟</span>
              <select name="triedBefore" class="select">
                <option value="no" ${prevTried === "no" ? "selected" : ""}>لا</option>
                <option value="yes" ${prevTried === "yes" ? "selected" : ""}>نعم</option>
              </select>
            </label>

            <label class="field">
              <span>درجتك السابقة (إذا سبق اختبرت)</span>
              <input name="previousScore" class="input" inputmode="numeric" placeholder="مثال: 72" value="${escapeHtml(prev.previousScore || "")}" />
            </label>

            <label class="field">
              <span>الدرجة المستهدفة (اختياري)</span>
              <input name="targetScore" class="input" inputmode="numeric" placeholder="مثال: 85" value="${escapeHtml(prev.targetScore || "")}" />
            </label>

            <label class="field">
              <span>وش أكثر شي تحسّه واقف معك؟ (اختياري)</span>
              <select name="selfWeak" class="select">
                <option value="" ${!prev.selfWeak ? "selected" : ""}>اختر…</option>
                <option value="grammar" ${prev.selfWeak === "grammar" ? "selected" : ""}>Grammar (القواعد)</option>
                <option value="reading" ${prev.selfWeak === "reading" ? "selected" : ""}>Reading (القراءة)</option>
                <option value="listening" ${prev.selfWeak === "listening" ? "selected" : ""}>Listening (الاستماع)</option>
                <option value="vocab" ${prev.selfWeak === "vocab" ? "selected" : ""}>Vocabulary (المفردات)</option>
              </select>
            </label>
          </div>

          <div class="note">
            <strong>معلومة سريعة:</strong> الاختبار عبارة عن 20 سؤال عشوائي من بنك أسئلة كبير، عشان يطلع لك تحليل واقعي.
          </div>

          <div class="actions">
            <button type="submit" class="btn btn-primary">ابدأ الاختبار</button>
            <a class="btn btn-ghost" href="./index.html">رجوع للرئيسية</a>
          </div>
        </form>

        <div class="muted">
          * إذا رجعت تعيد الاختبار، راح تتغير الأسئلة غالبًا (عشوائي من بنك الأسئلة).
        </div>
      </div>
    `;

    const form = document.getElementById("ltPreForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const profile = {
        name: (fd.get("name") || "").toString().trim(),
        daysBucket: (fd.get("daysBucket") || "15-30").toString(),
        triedBefore: (fd.get("triedBefore") || "no").toString(),
        previousScore: (fd.get("previousScore") || "").toString().trim(),
        targetScore: (fd.get("targetScore") || "").toString().trim(),
        selfWeak: (fd.get("selfWeak") || "").toString()
      };

      const session = {
        startedAt: nowISO(),
        profile,
        step: "loading"
      };
      saveSession(session);

      try {
        renderLoading();
        const bank = await loadBank();
        if (bank.length < 30) {
          renderError("بنك الأسئلة غير كافي. تأكد من ملف questions.json.");
          return;
        }
        const picked = pickRandom(bank, 20);
        const quiz = {
          questions: picked,
          answers: new Array(picked.length).fill(null),
          currentIndex: 0
        };
        session.step = "quiz";
        session.quiz = {
          ids: picked.map(q => q.id),
          currentIndex: 0,
          answers: quiz.answers
        };
        saveSession(session);

        renderQuiz(profile, quiz);
      } catch (err) {
        console.error(err);
        renderError("صار خطأ في تحميل بنك الأسئلة. جرّب تحديث الصفحة.");
      }
    });
  }

  function renderLoading() {
    document.getElementById("ltBody").innerHTML = `
      <div class="stack">
        <div class="note">
          جاري تجهيز الاختبار… لحظة بس ⏳
        </div>
      </div>
    `;
  }

  function renderError(msg) {
    document.getElementById("ltBody").innerHTML = `
      <div class="stack">
        <div class="note note-danger">
          <strong>تنبيه</strong><br/>
          ${escapeHtml(msg)}
        </div>
        <div class="actions">
          <button class="btn btn-primary" id="retryBtn">إعادة المحاولة</button>
          <a class="btn btn-ghost" href="./index.html">رجوع للرئيسية</a>
        </div>
      </div>
    `;
    document.getElementById("retryBtn").addEventListener("click", () => {
      boot();
    });
  }

  function renderQuiz(profile, quiz) {
    const total = quiz.questions.length;

    const render = () => {
      const idx = quiz.currentIndex;
      const q = quiz.questions[idx];
      const picked = quiz.answers[idx];

      const pct = Math.round(((idx) / total) * 100);
      const progressLabel = `السؤال ${idx + 1} من ${total}`;

      const optionsHtml = q.choices.map((c, i) => {
        const isActive = picked === i;
        return `
          <button type="button" class="opt ${isActive ? "opt--active" : ""}" data-opt="${i}">
            <span class="opt__key">${String.fromCharCode(65 + i)}</span>
            <span class="opt__txt">${escapeHtml(c)}</span>
          </button>
        `;
      }).join("");

      document.getElementById("ltBody").innerHTML = `
        <div class="stack">
          <div class="progress">
            <div class="progress__bar" style="width:${pct}%"></div>
          </div>
          <div class="muted">${escapeHtml(progressLabel)}</div>

          <div class="qcard">
            <div class="qmeta">
              <span class="pill">${escapeHtml((q.section || "general").toUpperCase())}</span>
            </div>
            <h2 class="h2">${escapeHtml(q.prompt)}</h2>
            <div class="opts" id="optsWrap">${optionsHtml}</div>
          </div>

          <div class="actions">
            <button type="button" class="btn btn-ghost" id="backBtn" ${idx === 0 ? "disabled" : ""}>السابق</button>
            <button type="button" class="btn btn-primary" id="nextBtn">${idx === total - 1 ? "إنهاء وعرض الخطة" : "التالي"}</button>
          </div>

          <div class="muted">
            تلميح: لا تطوّل… جاوب حسب الأفضل عندك. بعدين نطلع لك الخطة بشكل واضح.
          </div>
        </div>
      `;

      const optsWrap = document.getElementById("optsWrap");
      optsWrap.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-opt]");
        if (!btn) return;
        const i = Number(btn.getAttribute("data-opt"));
        quiz.answers[idx] = i;

        // persist session lightweight
        const s = loadSession() || {};
        if (s.quiz) {
          s.quiz.currentIndex = quiz.currentIndex;
          s.quiz.answers = quiz.answers;
          saveSession(s);
        }

        render();
      });

      document.getElementById("backBtn").addEventListener("click", () => {
        if (quiz.currentIndex > 0) quiz.currentIndex--;
        const s = loadSession() || {};
        if (s.quiz) {
          s.quiz.currentIndex = quiz.currentIndex;
          saveSession(s);
        }
        render();
      });

      document.getElementById("nextBtn").addEventListener("click", () => {
        if (quiz.answers[idx] === null) {
          toast("اختَر إجابة قبل لا تكمل 🙏");
          return;
        }
        if (quiz.currentIndex < total - 1) {
          quiz.currentIndex++;
          const s = loadSession() || {};
          if (s.quiz) {
            s.quiz.currentIndex = quiz.currentIndex;
            saveSession(s);
          }
          render();
          return;
        }

        // Finish
        finalize(profile, quiz);
      });
    };

    render();
  }

  function finalize(profile, quiz) {
    const score = computeScore(quiz.questions, quiz.answers);

    const daysToExam = daysBucketToDays(profile.daysBucket);
    const plan = buildPlan({
      daysToExam,
      weakOrder: score.weakOrder,
      profile
    });

    // Prepare payload for results page
    const payload = {
      createdAt: nowISO(),
      profile,
      quiz: {
        total: score.total,
        correct: score.correct,
        pct: score.pct,
        bySection: score.bySection,
        wrongItems: score.wrongItems.slice(0, 12), // limit for UI
        questionIds: quiz.questions.map(q => q.id)
      },
      plan,
      pricing: DEFAULTS.pricing,
      // Important: price should show only after test, so results page reads from here
      flags: {
        showPrice: true,
        showRegisterCTA: true
      }
    };

    saveResult(payload);

    // Clear session to avoid confusion
    try { localStorage.removeItem(LS_SESSION); } catch (e) {}

    // Go to results
    window.location.href = "./results.html";
  }

  function boot() {
    renderShell();
    const session = loadSession();
    // We intentionally don't auto-resume quiz to avoid confusion; user can restart.
    renderPreForm(session);
  }

  // Kickoff
  boot();
})();
