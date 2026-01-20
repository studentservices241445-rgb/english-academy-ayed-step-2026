/* assets/register.js
   - نسخ بيانات التحويل بزر واحد
   - تحقق من نموذج التسجيل (مع الإيصال + التعهدات)
   - توليد رسالة تليجرام جاهزة وفتحها تلقائيًا للحساب الرسمي
*/

(() => {
  "use strict";

  // ✅ عدّل هذا لو تغيّر الحساب الرسمي
  const ACADEMY_TELEGRAM_USERNAME = "Ayed_Academy_2026"; // بدون @
  const COURSE_NAME = "الدورة المكثفة STEP 2026";
  const DISCOUNT_PRICE = "349";
  const OFFICIAL_PRICE = "599";

  // ===== Helpers =====
  const $ = (sel, root = document) => root.querySelector(sel);

  function safeText(el) {
    return (el?.textContent || "").trim();
  }

  function encodeTG(text) {
    return encodeURIComponent(text);
  }

  function openTelegramWithMessage(message) {
    // أفضل رابط لفتح واجهة المشاركة في تليجرام مع النص جاهز
    const shareUrl = `https://t.me/share/url?url=&text=${encodeTG(message)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  function toast(msg, type = "info") {
    // لو فيه نظام توست جاهز في app.js استخدمه
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

  function requireValue(input, label) {
    const v = (input?.value || "").trim();
    if (!v) throw new Error(`فضلاً اكتب ${label}.`);
    return v;
  }

  function requireChecked(input, label) {
    if (!input?.checked) throw new Error(`لازم توافق على: ${label}`);
    return true;
  }

  function hasReceipt(fileInput) {
    return !!(fileInput && fileInput.files && fileInput.files.length > 0);
  }

  function getBankDataFromPage() {
    // موجودة في register.html
    const bankName = safeText($("#bankName"));
    const bankBank = safeText($("#bankBank"));
    const bankIban = safeText($("#bankIban"));
    const bankAcc = safeText($("#bankAcc"));
    const bankAmount = safeText($("#bankAmount")) || DISCOUNT_PRICE;
    const bankPurpose = safeText($("#bankPurpose")) || "مشتريات";

    return { bankName, bankBank, bankIban, bankAcc, bankAmount, bankPurpose };
  }

  function pickTestResult() {
    // دعم أكثر من مفتاح لأن الاختبار قد يخزن بأسماء مختلفة
    const keys = [
      "ayedTestResult",
      "ayed_test_result",
      "step_test_result",
      "test_result",
      "testResult",
      "ayed_result",
      "ayedPlan",
      "ayed_plan",
    ];

    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") return { key: k, data: parsed };
      } catch (_) {}
    }
    return null;
  }

  function buildTelegramMessage(payload) {
    const {
      fullName,
      phone,
      email,
      telegramUser,
      testRegion,
      transferTime,
      bank,
      planSummary,
    } = payload;

    const lines = [];

    lines.push(`السلام عليكم ورحمة الله وبركاته`);
    lines.push(``);
    lines.push(`أرفق لكم طلب *تأكيد اشتراك* في: *${COURSE_NAME}* ✅`);
    lines.push(``);
    lines.push(`*بيانات الطالب:*`);
    lines.push(`- الاسم: ${fullName}`);
    lines.push(`- الجوال: ${phone}`);
    lines.push(`- البريد: ${email}`);
    lines.push(`- تليجرام الطالب: @${telegramUser.replace(/^@/, "")}`);
    if (testRegion) lines.push(`- منطقة الاختبار (اختياري): ${testRegion}`);
    lines.push(``);

    lines.push(`*بيانات التحويل:*`);
    lines.push(`- المبلغ: ${bank.bankAmount} ر.س (السعر الحالي)`);
    lines.push(`- غرض التحويل: ${bank.bankPurpose}`);
    lines.push(`- وقت التحويل: ${transferTime}`);
    lines.push(`- اسم الحساب: ${bank.bankName}`);
    lines.push(`- البنك: ${bank.bankBank}`);
    lines.push(`- الآيبان: ${bank.bankIban}`);
    lines.push(`- رقم الحساب: ${bank.bankAcc}`);
    lines.push(``);

    if (planSummary) {
      lines.push(`*ملخص الخطة (من اختبار تحديد المستوى):*`);
      lines.push(planSummary);
      lines.push(``);
    }

    lines.push(`🔴 *مهم جدًا:*`);
    lines.push(`فضلاً *أعد إرسال الإيصال هنا في هذه المحادثة* (ملف أو صورة واضحة) للتأكيد النهائي وتفعيل الاشتراك.`);
    lines.push(``);
    lines.push(`__________________________`);
    lines.push(`بعد إرسال الإيصال: انتظر الرد بأقرب وقت 🙏`);
    lines.push(`ويفضّل *عدم تكرار الرسائل* حتى لا يتأخر تأكيدك بسبب كثرة الطلبات.`);

    return lines.join("\n");
  }

  function planToText(resultObj) {
    // نحاول نطلع “مُلخّص” مقنع لو متوفر، أو نكوّنه بشكل بسيط
    const d = resultObj?.data || resultObj;

    // أسماء محتملة
    const summary =
      d.planSummary ||
      d.summary ||
      d.plan ||
      d.recommendation ||
      d.recommendations ||
      d.studyPlan;

    if (typeof summary === "string" && summary.trim()) return summary.trim();

    // لو فيه درجات/نقاط
    const score = d.score ?? d.totalScore ?? d.percent ?? d.percentage;
    const weak = d.weakAreas || d.weak || d.weaknesses;
    const strong = d.strongAreas || d.strong;

    const parts = [];
    if (score !== undefined && score !== null) parts.push(`- نتيجتك العامة: ${score}%`);
    if (weak && Array.isArray(weak) && weak.length) parts.push(`- نقاط تحتاج تركيز: ${weak.join("، ")}`);
    if (strong && Array.isArray(strong) && strong.length) parts.push(`- نقاط قوية عندك: ${strong.join("، ")}`);

    return parts.length ? parts.join("\n") : "";
  }

  // ===== Copy buttons =====
  function initCopyButtons() {
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-copy]");
      if (!btn) return;

      const sel = btn.getAttribute("data-copy");
      const target = sel ? $(sel) : null;
      const text = safeText(target);

      if (!text) {
        toast("ما قدرت أنسخ… تأكد من وجود القيمة.", "warn");
        return;
      }

      try {
        await navigator.clipboard.writeText(text);
        toast("تم النسخ ✅", "success");
      } catch (_) {
        // fallback قديم
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
          toast("تم النسخ ✅", "success");
        } catch (err) {
          toast("تعذر النسخ… انسخ يدويًا.", "warn");
        } finally {
          ta.remove();
        }
      }
    });
  }

  // ===== Form submit =====
  function initForm() {
    const form = $("#regForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      try {
        const fullName = requireValue(form.elements.fullName, "اسمك الثلاثي");
        const phone = requireValue(form.elements.phone, "رقم الجوال");
        const email = requireValue(form.elements.email, "البريد الإلكتروني");
        const telegramUser = requireValue(form.elements.telegram, "اسم مستخدم تليجرام");
        const transferTime = requireValue(form.elements.transferTime, "وقت التحويل");
        const testRegion = (form.elements.testRegion?.value || "").trim();

        const receiptInput = form.elements.receipt;
        if (!hasReceipt(receiptInput)) {
          throw new Error("لازم ترفق الإيصال قبل الإرسال.");
        }

        requireChecked(form.elements.agree1, "تعهد عدم مشاركة المحتوى");
        requireChecked(form.elements.agree2, "تأكيد التحويل للحساب الرسمي");
        requireChecked(form.elements.agree3, "الموافقة على السياسات");

        const bank = getBankDataFromPage();

        // ✅ (اختياري) لو ودك تمنع التسجيل بدون اختبار: فعّل الشرط التالي
        // const testRes = pickTestResult();
        // if (!testRes) throw new Error("لازم تكمل اختبار تحديد المستوى أولاً.");

        const testRes = pickTestResult();
        const planSummary = testRes ? planToText(testRes) : "";

        const message = buildTelegramMessage({
          fullName,
          phone,
          email,
          telegramUser,
          testRegion,
          transferTime,
          bank,
          planSummary,
        });

        // حفظ نسخة محلية (اختياري)
        try {
          localStorage.setItem(
            "ayed_last_registration",
            JSON.stringify({
              fullName,
              phone,
              email,
              telegramUser,
              testRegion,
              transferTime,
              ts: Date.now(),
            })
          );
        } catch (_) {}

        toast("تم تجهيز الرسالة… بنفتح تليجرام الآن ✅", "success");

        // فتح التليجرام برسالة جاهزة
        openTelegramWithMessage(message);

        // تذكير مهم للمستخدم
        setTimeout(() => {
          toast("لا تنسى: أعد إرسال الإيصال داخل التليجرام للتأكيد النهائي 🔴", "warn");
        }, 1200);
      } catch (err) {
        toast(err.message || "فيه خطأ… تأكد من البيانات.", "warn");
      }
    });

    // زر تعليمي اختياري: فتح الحساب الرسمي مباشرة
    const quickOpen = document.createElement("a");
    quickOpen.href = `https://t.me/${ACADEMY_TELEGRAM_USERNAME}`;
    quickOpen.target = "_blank";
    quickOpen.rel = "noopener noreferrer";
    quickOpen.className = "btn btn--ghost";
    quickOpen.textContent = "فتح حساب الأكاديمية على التليجرام";
    const actions = form.querySelector(".actions");
    if (actions) actions.appendChild(quickOpen);
  }

  // ===== Boot =====
  function boot() {
    initCopyButtons();
    initForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
