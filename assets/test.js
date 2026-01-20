// test.js: منطق اختبار تحديد المستوى (بيانات سريعة + 20 سؤال عشوائي + تحليل)
(function() {
  const state = {
    info: {},
    questions: [],
    current: 0,
    answers: []
  };
  const mount = document.getElementById('testApp');

  async function loadQuestions() {
    try {
      // تحميل الأسئلة من الملف الموجود في الجذر
      const res = await fetch('../questions.json?v=20260120');
      const data = await res.json();
      // تجهيز الحقول لتوحيد الخيارات بين الملفات القديمة والجديدة
      const prepared = data.map((q) => {
        const copy = Object.assign({}, q);
        // تحويل choices إلى options إن وُجدت
        if (!copy.options && copy.choices) copy.options = copy.choices;
        // تحويل answerIndex إلى answer إن كان موجوداً
        if (typeof copy.answer === 'undefined' && typeof copy.answerIndex !== 'undefined') {
          copy.answer = copy.answerIndex;
        }
        return copy;
      });
      // خلط الأسئلة واختيار 20 سؤال بشكل عشوائي
      const shuffled = prepared.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 20);
    } catch (err) {
      console.error('Error loading questions', err);
      return [];
    }
  }

  function renderInfoForm() {
    mount.innerHTML = `
      <form id="quickInfoForm" class="info-form">
        <h2>معلومات سريعة</h2>
        <div class="form-group">
          <label for="qi-examDate">موعد الاختبار</label>
          <select id="qi-examDate">
            <option value="خلال 7 أيام">خلال 7 أيام</option>
            <option value="خلال 14 يوم">خلال 14 يوم</option>
            <option value="خلال شهر">خلال شهر</option>
            <option value="أكثر من شهر">أكثر من شهر</option>
            <option value="لم أحدد بعد">لسا ما حجزت</option>
          </select>
        </div>
        <div class="form-group">
          <label for="qi-level">مستواك الحالي</label>
          <select id="qi-level">
            <option value="مبتدئ">مبتدئ</option>
            <option value="متوسط">متوسط</option>
            <option value="متقدم">متقدم</option>
          </select>
        </div>
        <div class="form-group">
          <label for="qi-tested">هل اختبرت STEP قبل؟</label>
          <select id="qi-tested">
            <option value="لا">لا</option>
            <option value="نعم">نعم</option>
          </select>
        </div>
        <div class="form-group">
          <label for="qi-prevScore">الدرجة السابقة (إن وجدت)</label>
          <input type="text" id="qi-prevScore" />
        </div>
        <div class="form-group">
          <label for="qi-target">الدرجة المستهدفة</label>
          <input type="text" id="qi-target" />
        </div>
        <div class="form-group">
          <label for="qi-hours">عدد ساعات المذاكرة اليومية</label>
          <select id="qi-hours">
            <option value="1">1 ساعة</option>
            <option value="2">2 ساعتين</option>
            <option value="3">3 ساعات</option>
            <option value="4+">4+ ساعات</option>
          </select>
        </div>
        <div class="form-group">
          <label for="qi-mode">طريقة المذاكرة المفضلة</label>
          <select id="qi-mode">
            <option value="فيديو + تطبيق">فيديو + تطبيق</option>
            <option value="ملفات PDF + حل">ملفات PDF + حل</option>
            <option value="مختلط">مختلط</option>
          </select>
        </div>
        <div class="form-group">
          <label for="qi-region">منطقة الاختبار (اختياري)</label>
          <select id="qi-region">
            <option value="غير محدد">غير محدد</option>
            <option value="الرياض">الرياض</option>
            <option value="جدة">جدة</option>
            <option value="الشرقية">الشرقية</option>
            <option value="القصيم">القصيم</option>
            <option value="أخرى">أخرى</option>
          </select>
        </div>
        <div class="form-group">
          <label for="qi-contact">وسيلة التواصل (اختياري)</label>
          <select id="qi-contact">
            <option value="">لا شيء</option>
            <option value="تليجرام">تليجرام</option>
            <option value="واتساب">واتساب</option>
            <option value="إيميل">إيميل</option>
          </select>
        </div>
        <div class="form-group">
          <label for="qi-contactVal">بيانات التواصل</label>
          <input type="text" id="qi-contactVal" />
        </div>
        <button type="submit" class="cta-btn">ابدأ الاختبار</button>
      </form>
    `;
    const form = document.getElementById('quickInfoForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // حفظ بيانات النموذج
      state.info = {
        examDate: document.getElementById('qi-examDate').value,
        level: document.getElementById('qi-level').value,
        testedBefore: document.getElementById('qi-tested').value,
        previousScore: document.getElementById('qi-prevScore').value.trim(),
        targetScore: document.getElementById('qi-target').value.trim(),
        hours: document.getElementById('qi-hours').value,
        studyMode: document.getElementById('qi-mode').value,
        region: document.getElementById('qi-region').value,
        contactMethod: document.getElementById('qi-contact').value,
        contactInfo: document.getElementById('qi-contactVal').value.trim()
      };
      renderQuestion();
    });
  }

  function renderQuestion() {
    const q = state.questions[state.current];
    const total = state.questions.length;
    // بناء قائمة الخيارات
    let optsHtml = '<ul class="options">';
    q.options.forEach((opt, idx) => {
      const selected = state.answers[state.current] === idx;
      optsHtml += `<li data-index="${idx}"${selected ? ' class="selected"' : ''}>${opt}</li>`;
    });
    optsHtml += '</ul>';
    const progressPct = ((state.current + 1) / total) * 100;
    mount.innerHTML = `
      <div class="question-wrap">
        <h2>سؤال ${state.current + 1} من ${total}</h2>
        <p class="question-prompt">${q.prompt}</p>
        ${optsHtml}
        <div class="progress-bar"><div class="progress" style="width:${progressPct}%"></div></div>
        <div class="nav-buttons" style="margin-top:1rem; display:flex; justify-content:space-between;">
          <button id="prevBtn" ${state.current === 0 ? 'disabled' : ''}>السابق</button>
          <button id="nextBtn">${state.current === total - 1 ? 'إنهاء الاختبار' : 'التالي'}</button>
        </div>
      </div>
    `;
    // اختيار الإجابة
    mount.querySelectorAll('.options li').forEach(li => {
      li.addEventListener('click', () => {
        const idx = parseInt(li.getAttribute('data-index'));
        state.answers[state.current] = idx;
        mount.querySelectorAll('.options li').forEach(x => x.classList.remove('selected'));
        li.classList.add('selected');
      });
    });
    document.getElementById('prevBtn').addEventListener('click', () => {
      if (state.current > 0) {
        state.current--;
        renderQuestion();
      }
    });
    document.getElementById('nextBtn').addEventListener('click', () => {
      if (state.current < total - 1) {
        // تأكد من اختيار إجابة قبل الانتقال
        if (typeof state.answers[state.current] === 'undefined') {
          alert('يرجى اختيار إجابة قبل الانتقال للسؤال التالي');
          return;
        }
        state.current++;
        renderQuestion();
      } else {
        // السؤال الأخير
        if (typeof state.answers[state.current] === 'undefined') {
          alert('يرجى اختيار إجابة قبل إنهاء الاختبار');
          return;
        }
        finishTest();
      }
    });
  }

  function finishTest() {
    // حساب النتيجة النهائية
    const total = state.questions.length;
    let correct = 0;
    const sectionCounts = {};
    const sectionCorrect = {};
    const wrongSkills = {};
    state.questions.forEach((q, idx) => {
      const section = q.section || 'عام';
      sectionCounts[section] = (sectionCounts[section] || 0) + 1;
      const chosen = state.answers[idx];
      if (chosen === q.answer) {
        correct++;
        sectionCorrect[section] = (sectionCorrect[section] || 0) + 1;
      } else {
        const tag = q.skillTag || 'مهارة عامة';
        wrongSkills[tag] = (wrongSkills[tag] || 0) + 1;
      }
    });
    // حساب النسب لكل قسم
    const stats = {};
    Object.keys(sectionCounts).forEach((sec) => {
      const score = sectionCorrect[sec] || 0;
      const pct = (score / sectionCounts[sec]) * 100;
      stats[sec] = parseFloat(pct.toFixed(0));
    });
    const percent = (correct / total) * 100;
    const results = {
      percent: parseFloat(percent.toFixed(0)),
      stats,
      wrongSkills,
      info: state.info
    };
    localStorage.setItem('ayedResults', JSON.stringify(results));
    // الانتقال لصفحة النتائج
    window.location.href = './results.html';
  }

  // التهيئة الأولية
  document.addEventListener('DOMContentLoaded', async () => {
    state.questions = await loadQuestions();
    renderInfoForm();
  });
})();
