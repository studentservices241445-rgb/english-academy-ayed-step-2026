/* assets/test.js
   اختبار تحديد المستوى: خطوة بخطوة + اختيار عشوائي 20 سؤال من بنك الأسئلة questions.json
*/

(() => {
  const $ = (sel) => document.querySelector(sel);

  // عناصر الصفحة
  const app = $("#levelTestApp");
  if (!app) return; // مو صفحة الاختبار

  const stepProfile = $("#stepProfile");
  const stepQuiz = $("#stepQuiz");
  const stepLoading = $("#stepLoading");

  const startBtn = $("#startTestBtn");
  const quitBtn = $("#quitBtn");
  const prevBtn = $("#prevBtn");
  const nextBtn = $("#nextBtn");

  const qIndexEl = $("#qIndex");
  const qTotalEl = $("#qTotal");
  const progressFill = $("#progressFill");

  const qPrompt = $("#qPrompt");
  const qOptions = $("#qOptions");
  const qHint = $("#qHint");
  const qSectionPill = $("#qSectionPill");
  const qTagPill = $("#qTagPill");

  // حقول البيانات
  const nameEl = $("#name");
  const examWindowEl = $("#examWindow");
  const prevTestEl = $("#prevTest");
  const prevScoreEl = $("#prevScore");
  const targetScoreEl = $("#targetScore");
  const studyTimeEl = $("#studyTime");
  const learningStyleEl = $("#learningStyle");
  const testCityEl = $("#testCity");

  // إعدادات
  const QUESTIONS_URL = "./assets/questions.json?v=2026-01-20";
  const TEST_SIZE = 20; // المطلوب: 20 سؤال عشوائي
  const STORAGE_KEY = "ayed_step_level_test_v1";

  // حالة الاختبار
  let bank = [];
  let selected = []; // الأسئلة اللي اخترناها للاختبار الحالي
  let idx = 0;
  let answers = {}; // {questionId: selectedIndex}
  let profile = null;

  // أدوات مساعدة
  const toast = (msg, type = "info") => {
    if (typeof window.showToast === "function") return window.showToast(msg, type);
    // fallback بسيط لو ما كان موجود
    console.log(`[${type}] ${msg}`);
    alert(msg);
  };

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const clampNum = (v, min, max) => {
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return Math.max(min, Math.min(max, n));
  };

  const getSelectedDifficulties = () => {
    const checks = document.querySelectorAll(".chip__check:checked");
    return Array.from(checks).map((c) => c.value);
  };

  const showStep = (which) => {
    stepProfile.style.display = which === "profile" ? "" : "none";
    stepQuiz.style.display = which === "quiz" ? "" : "none";
    stepLoading.style.display = which === "loading" ? "" : "none";
  };

  const validateProfile = () => {
    const examWindow = examWindowEl.value;
    if (!examWindow) {
      toast("حدد متى اختبارك عشان نطلع لك خطة دقيقة ✅", "warn");
      examWindowEl.focus();
      return null;
    }

    return {
      name: (nameEl.value || "").trim(),
      examWindow: examWindow, // string
      prevTest: prevTestEl.value || "no",
      prevScore: clampNum(prevScoreEl.value, 0, 100),
      targetScore: clampNum(targetScoreEl.value, 0, 100),
      studyTime: Number(studyTimeEl.value || 60),
      learningStyle: learningStyleEl.value || "mixed",
      testCity: (testCityEl.value || "").trim(),
      painPoints: getSelectedDifficulties(),
      startedAt: new Date().toISOString(),
    };
  };

  // قراءة بنك الأسئلة
  const loadQuestions = async () => {
    const res = await fetch(QUESTIONS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("تعذر تحميل بنك الأسئلة");
    const data = await res.json();

    // نتوقع صيغة:
    // [{ id, section, prompt, choices:[...], answer: 0.., explanation, tag }]
    if (!Array.isArray(data) || data.length < 10) throw new Error("بنك الأسئلة غير صالح");
    return data;
  };

  // اختيار 20 سؤال عشوائي (مع دعم إعادة الاختبار بأسئلة مختلفة)
  const pickRandomTest = (allQuestions, size) => {
    const shuffled = shuffle(allQuestions);

    // لو في أقسام، نقدر نوزع بشكل لطيف (اختياري)
    // بس نخليها عامة: عشوائي كامل
    return shuffled.slice(0, Math.min(size, shuffled.length));
  };

  // بناء خيارات السؤال
  const renderQuestion = () => {
    const q = selected[idx];
    if (!q) return;

    const total = selected.length;

    qIndexEl.textContent = String(idx + 1);
    qTotalEl.textContent = String(total);

    const pct = Math.round(((idx) / total) * 100);
    progressFill.style.width = `${pct}%`;

    qSectionPill.textContent = q.section || "General";
    qTagPill.textContent = q.tag || "STEP";

    qPrompt.textContent = q.prompt || "";

    qOptions.innerHTML = "";
    qHint.style.display = "none";
    qHint.textContent = "";

    const selectedIndex = answers[q.id];

    (q.choices || []).forEach((choice, i) => {
      const id = `opt_${q.id}_${i}`;
      const wrap = document.createElement("label");
      wrap.className = "option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = `q_${q.id}`;
      input.value = String(i);
      input.id = id;
      input.checked = selectedIndex === i;

      const txt = document.createElement("div");
      txt.className = "option__text";
      txt.textContent = choice;

      wrap.appendChild(input);
      wrap.appendChild(txt);

      wrap.addEventListener("click", () => {
        answers[q.id] = i;
        // نعطي لمسة: نعرض تلميح خفيف بعد اختيار
        if (q.hint) {
          qHint.style.display = "";
          qHint.textContent = q.hint;
        } else {
          qHint.style.display = "none";
        }
      });

      qOptions.appendChild(wrap);
    });

    prevBtn.disabled = idx === 0;
    nextBtn.textContent = idx === total - 1 ? "إنهاء الاختبار" : "التالي";
  };

  const getAnsweredCount = () => {
    let c = 0;
    for (const q of selected) {
      if (typeof answers[q.id] === "number") c++;
    }
    return c;
  };

  const ensureAnsweredCurrent = () => {
    const q = selected[idx];
    if (!q) return false;
    if (typeof answers[q.id] !== "number") {
      toast("اختر إجابة عشان نقدر نكمل ✅", "warn");
      return false;
    }
    return true;
  };

  const computeResult = () => {
    // نحسب الصحيح/الخطأ لكل قسم
    const perSection = {}; // {Grammar:{correct,total}, ...}
    let correct = 0;
    let total = selected.length;

    const review = selected.map((q) => {
      const sec = q.section || "General";
      if (!perSection[sec]) perSection[sec] = { correct: 0, total: 0 };
      perSection[sec].total++;

      const chosen = answers[q.id];
      const isCorrect = chosen === q.answer;
      if (isCorrect) {
        correct++;
        perSection[sec].correct++;
      }

      return {
        id: q.id,
        section: sec,
        tag: q.tag || "STEP",
        prompt: q.prompt,
        choices: q.choices,
        chosen,
        answer: q.answer,
        explanation: q.explanation || "",
        // نتركها مختصرة
      };
    });

    const percent = total ? Math.round((correct / total) * 100) : 0;

    return {
      correct,
      total,
      percent,
      perSection,
      review,
    };
  };

  const saveAndGoResults = () => {
    const result = computeResult();

    const payload = {
      version: 1,
      profile,
      test: {
        size: selected.length,
        questionIds: selected.map((q) => q.id),
        answers,
        finishedAt: new Date().toISOString(),
      },
      result,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // نرسل المستخدم للنتائج
    window.location.href = "./results.html";
  };

  // بدء الاختبار
  const startTest = async () => {
    profile = validateProfile();
    if (!profile) return;

    showStep("loading");

    try {
      bank = await loadQuestions();
      selected = pickRandomTest(bank, TEST_SIZE);

      if (selected.length < 5) throw new Error("عدد الأسئلة غير كافي");

      // إعادة تعيين الحالة
      idx = 0;
      answers = {};

      showStep("quiz");
      qTotalEl.textContent = String(selected.length);
      renderQuestion();

      toast("ابدأ على مهلك… وبعدها الخطة تطلع لك جاهزة ✨", "success");
    } catch (e) {
      console.error(e);
      showStep("profile");
      toast("صار خلل في تحميل الأسئلة. حاول تحديث الصفحة.", "error");
    }
  };

  // الأحداث
  startBtn?.addEventListener("click", startTest);

  quitBtn?.addEventListener("click", () => {
    if (confirm("متأكد تبي تلغي وترجع؟")) {
      showStep("profile");
      idx = 0;
      answers = {};
      selected = [];
    }
  });

  prevBtn?.addEventListener("click", () => {
    if (idx > 0) {
      idx--;
      renderQuestion();
      // تحديث شريط التقدم بعد الرجوع
      const total = selected.length;
      progressFill.style.width = `${Math.round((idx / total) * 100)}%`;
    }
  });

  nextBtn?.addEventListener("click", () => {
    if (!ensureAnsweredCurrent()) return;

    const total = selected.length;

    // آخر سؤال: إنهاء
    if (idx === total - 1) {
      const answered = getAnsweredCount();
      if (answered < total) {
        toast("باقي أسئلة بدون إجابة… تأكد قبل الإنهاء.", "warn");
        return;
      }
      showStep("loading");
      setTimeout(saveAndGoResults, 350);
      return;
    }

    idx++;
    renderQuestion();

    const pct = Math.round((idx / total) * 100);
    progressFill.style.width = `${pct}%`;
  });

  // في حال المستخدم رجع للصفحة من جديد
  showStep("profile");

  // تلميح لطيف (بدون إجبار)
  // نخلي كل شيء جاهز لكن ما نعرض تسجيل هنا.
})();
