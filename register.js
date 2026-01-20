// register.js: نسخ بيانات التحويل وإنشاء رسالة تليجرام للتسجيل
document.addEventListener('DOMContentLoaded', () => {
  // نسخ البيانات إلى الحافظة
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-copy');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(value).then(() => {
          if (typeof toast === 'function') toast('تم النسخ إلى الحافظة');
        });
      }
    });
  });

  // إرسال طلب التسجيل
  const form = document.getElementById('registerForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const receiptInput = document.getElementById('receiptFile');
      if (!receiptInput.files || receiptInput.files.length === 0) {
        alert('يجب رفع الإيصال قبل الإرسال');
        document.getElementById('bankSection').scrollIntoView({behavior:'smooth'});
        return;
      }
      const fullName = document.getElementById('fullName').value.trim();
      const examDate = document.getElementById('examDate').value;
      const prevExam = document.getElementById('previousExam').value;
      const previousScore = document.getElementById('previousScore').value.trim();
      const targetScore = document.getElementById('targetScore').value.trim();
      const region = document.getElementById('region').value;
      const contactMethod = document.getElementById('contactMethod').value;
      const contactInfo = document.getElementById('contactInfo').value.trim();
      const notes = document.getElementById('notes').value.trim();
      let msg = '';
      msg += 'السلام عليكم ورحمة الله وبركاته\n\n';
      msg += 'تم التحويل للاشتراك في «دورة STEP المكثفة 2026» وأرسل لكم الإيصال الآن للتأكيد والتفعيل.\n\n';
      msg += `الاسم: ${fullName}\n`;
      msg += `موعد الاختبار: ${examDate}\n`;
      msg += `هل اختبرت سابقاً؟ ${prevExam}\n`;
      msg += `الدرجة السابقة: ${previousScore || 'غير محدد'}\n`;
      msg += `الدرجة المستهدفة: ${targetScore || 'غير محدد'}\n`;
      msg += `منطقة الاختبار: ${region}\n`;
      msg += `وسيلة التواصل: ${contactMethod}${contactInfo ? ' - ' + contactInfo : ''}\n`;
      if (notes) msg += `ملاحظات: ${notes}\n`;
      msg += '\n---\n';
      msg += 'ملاحظة مهمة: سأقوم بإرفاق الإيصال هنا مرة أخرى (صورة/ملف) للتأكيد النهائي.\n';
      msg += 'فضلاً: لا أرسل أكثر من رسالة حتى لا يتأخر الرد علي.';
      const tgUser = 'Ayed_Academy_2026';
      const encoded = encodeURIComponent(msg);
      const tgLink = `https://t.me/${tgUser}?text=${encoded}`;
      window.location.href = tgLink;
    });
  }
});