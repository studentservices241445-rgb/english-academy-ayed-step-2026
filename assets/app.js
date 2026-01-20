
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('assistantToggle');
  const panel = document.getElementById('assistantPanel');
  const closeBtn = document.getElementById('assistantClose');
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => {
      panel.classList.toggle('open');
    });
  }
  if (closeBtn && panel) {
    closeBtn.addEventListener('click', () => {
      panel.classList.remove('open');
    });
  }
});
