(function() {
  document.addEventListener('DOMContentLoaded', async () => {
    const mount = document.getElementById('testApp');
    if (!mount) return;
    try {
      const res = await fetch('./assets/questions.json', {cache: 'no-cache'});
      const allQuestions = await res.json();
      const selected = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);
      let current = 0;
      const answers = new Array(selected.length);
      function render() {
        const q = selected[current];
        const progressPercent = Math.round((current / selected.length) * 100);
        const optionsHTML = q.options.map(opt => {
          const isSelected = answers[current] === opt;
          return `<button class="option${isSelected ? ' selected' : ''}">${opt}</button>`;
        }).join('');
        mount.innerHTML = `
          <div class="quiz-wrap">
            <div class="progress-wrap">
              <div class="progress-bar" style="width:${progressPercent}%"></div>
            </div>
            <h2 class="question-num">سؤال ${current + 1} من ${selected.length}</h2>
            <p class="prompt">${q.prompt}</p>
            <div class="options">${optionsHTML}</div>
            <div class="controls">
              ${current > 0 ? '<button id="prevBtn">السابق</button>' : ''}
              <button id="nextBtn" ${answers[current] ? '' : 'disabled'}>${current === selected.length - 1 ? 'عرض النتيجة' : 'التالي'}</button>
            </div>
          </div>
        `;
        mount.querySelectorAll('.option').forEach(btn => {
          btn.addEventListener('click', () => {
            answers[current] = btn.innerText;
            render();
          });
        });
        const prevBtn = mount.querySelector('#prevBtn');
        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            current--;
            render();
          });
        }
        const nextBtn = mount.querySelector('#nextBtn');
        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            if (!answers[current]) return;
            if (current === selected.length - 1) {
              showResults();
            } else {
              current++;
              render();
            }
          });
        }
      }
      function showResults() {
        const stats = {};
        let totalCorrect = 0;
        selected.forEach((q, idx) => {
          if (!stats[q.section]) stats[q.section] = { total: 0, correct: 0 };
          stats[q.section].total++;
          if (answers[idx] === q.answer) {
            stats[q.section].correct++;
            totalCorrect++;
          }
        });
        const percent = Math.round((totalCorrect / selected.length) * 100);
        let level;
        if (percent >= 80) level = 'متقدم';
        else if (percent >= 50) level = 'متوسط';
        else level = 'مبتدئ';
        const listItems = Object.keys(stats).map(sec => {
          const s = stats[sec];
          const secPercent = Math.round((s.correct / s.total) * 100);
          let secName = sec;
          if (sec === 'grammar') secName = 'القواعد';
          if (sec === 'reading') secName = 'القراءة';
          if (sec === 'listening') secName = 'الاستماع';
          return `<li>${secName}: ${s.correct} / ${s.total} (${secPercent}%)</li>`;
        }).join('');
  
              localStorage.setItem('ayedResults', JSON.stringify({
        totalCorrect: totalCorrect,
        totalQuestions: selected.length,
        percent: percent,
        level: level,
        stats: stats
      }));
mount.innerHTML = `
          <div class="results-wrap">
            <h2>نتيجتك</h2>
            <p>حصلت على ${totalCorrect} من ${selected.length} (${percent}%).</p>
            <p>مستواك التقريبي: <strong>${level}</strong></p>
            <h3>تحليل الأقسام:</h3>
            <ul>${listItems}</ul>
            <h3>خطة المذاكرة</h3>
            <p>ابدأ بمراجعة القسم الذي حصلت فيه على أقل نسبة، ثم انتقل إلى الأقسام الأخرى. خصص وقتًا يوميًا للدراسة وحل التمارين المرفقة.</p>
            <div class="price-box">
              <p>السعر المخفض: <span class="price-now">349 ريال</span></p>
              <p>السعر الرسمي: <del>599 ريال</del></p>
              <a href="./register.html" class="cta-button">سجّل الآن</a>
            </div>
          </div>
        `;
      }
      render();
    } catch (err) {
      mount.innerHTML = '<p>حدث خطأ في تحميل الاختبار. يرجى المحاولة لاحقًا.</p>';
      console.error(err);
    }
  });
})();
