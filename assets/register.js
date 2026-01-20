// register.js - handles copy buttons and form submission

window.addEventListener('DOMContentLoaded', function () {
  // copy to clipboard buttons
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const text = btn.getAttribute('data-copy');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          if (typeof toast === 'function') {
            toast('تم نسخ البيانات');
          }
        });
      }
    });
  });

  const form = document.getElementById('registerForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const receipt = document.getElementById('receipt');
      if (!receipt || !receipt.files || receipt.files.length === 0) {
        alert('يرجى رفع إيصال التحويل قبل الإرسال');
        receipt.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      // gather fields
      const name = document.getElementById('fullName').value.trim();
      const testDate = document.getElementById('testDate').value;
      const testedBefore = document.getElementById('testedBefore').value;
      const score = document.getElementById('score').value.trim();
      const method = document.getElementById('contactMethod').value;
      const handle = document.getElementById('contactHandle').value.trim();
      const region = document.getElementById('region').value.trim();
      const notes = document.getElementById('notes').value.trim();

      let msg = 'السلام عليكم،%0Aأرغب بالتسجيل في دورة STEP.%0A';
      msg += 'الاسم: ' + name + '%0A';
      if (testDate) msg += 'موعد الاختبار: ' + testDate + '%0A';
      if (testedBefore) msg += 'اختبرت سابقاً: ' + (testedBefore === 'yes' ? 'نعم' : 'لا') + '%0A';
      if (score) msg += 'الدرجة السابقة/المستهدفة: ' + score + '%0A';
      if (method) {
        let methodLabel = method;
        if (method === 'telegram') methodLabel = 'Telegram';
        else if (method === 'whatsapp') methodLabel = 'WhatsApp';
        else if (method === 'email') methodLabel = 'Email';
        msg += 'وسيلة التواصل المفضلة: ' + methodLabel;
        if (handle) msg += ' (' + handle + ')';
        msg += '%0A';
      }
      if (region) msg += 'المنطقة: ' + region + '%0A';
      if (notes) msg += 'ملاحظات: ' + notes + '%0A';

      msg += '_______%0A';
      msg += 'رجاءً ارفق الإيصال هنا مرة أخرى للتأكيد النهائي.%0A';
      msg += 'لا تكرر إرسال الرسائل حتى لا يتأخر الرد.%0A';

      const tgUser = 'AyedAcademy';
      const url = 'https://t.me/' + tgUser + '?text=' + msg;
      window.location.href = url;
    });
  }
});
