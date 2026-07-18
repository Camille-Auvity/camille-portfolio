// Dark mode toggle
const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  });
}

// Accent color customization
const accentPresets = {
  blue:   { accent: '#0077ff', accent2: '#00c6ff', accent3: '#0072ff', rgb: '0, 119, 255' },
  green:  { accent: '#059669', accent2: '#34d399', accent3: '#10b981', rgb: '5, 150, 105' },
  amber:  { accent: '#d97706', accent2: '#fbbf24', accent3: '#f59e0b', rgb: '217, 119, 6' },
  rose:   { accent: '#e11d48', accent2: '#fb7185', accent3: '#f43f5e', rgb: '225, 29, 72' },
  purple: { accent: '#7c3aed', accent2: '#a78bfa', accent3: '#8b5cf6', rgb: '124, 58, 237' },
};

function applyAccent(key) {
  const preset = accentPresets[key] || accentPresets.blue;
  const root = document.documentElement.style;
  root.setProperty('--c-accent', preset.accent);
  root.setProperty('--c-accent-2', preset.accent2);
  root.setProperty('--c-accent-3', preset.accent3);
  root.setProperty('--c-accent-soft', `rgba(${preset.rgb}, 0.7)`);
  root.setProperty('--c-accent-a08', `rgba(${preset.rgb}, 0.08)`);
  root.setProperty('--c-accent-a10', `rgba(${preset.rgb}, 0.1)`);
  root.setProperty('--c-accent-a15', `rgba(${preset.rgb}, 0.15)`);
  root.setProperty('--c-accent-a20', `rgba(${preset.rgb}, 0.2)`);
  root.setProperty('--c-accent-a25', `rgba(${preset.rgb}, 0.25)`);
  root.setProperty('--c-accent-a30', `rgba(${preset.rgb}, 0.3)`);
  root.setProperty('--c-accent-a40', `rgba(${preset.rgb}, 0.4)`);
}

const settingsToggleBtn = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
if (settingsToggleBtn && settingsPanel) {
  const swatches = settingsPanel.querySelectorAll('.accent-swatch');

  const setActiveSwatch = (key) => {
    swatches.forEach((sw) => sw.classList.toggle('active', sw.dataset.accent === key));
  };

  setActiveSwatch(localStorage.getItem('accent') || 'blue');

  const closePanel = () => {
    settingsPanel.classList.remove('open');
    settingsPanel.setAttribute('aria-hidden', 'true');
    settingsToggleBtn.setAttribute('aria-expanded', 'false');
  };

  settingsToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = settingsPanel.classList.toggle('open');
    settingsPanel.setAttribute('aria-hidden', String(!isOpen));
    settingsToggleBtn.setAttribute('aria-expanded', String(isOpen));
  });

  swatches.forEach((sw) => {
    sw.addEventListener('click', () => {
      const key = sw.dataset.accent;
      applyAccent(key);
      localStorage.setItem('accent', key);
      setActiveSwatch(key);
    });
  });

  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsToggleBtn) {
      closePanel();
    }
  });
}

if (document.getElementById('my-work-link')) {
  document.getElementById('my-work-link').addEventListener('click', () => {
    document.getElementById('my-work-section').scrollIntoView({behavior: "smooth"})
  })
}


// Drag to scroll for horizontal carousel
document.addEventListener("DOMContentLoaded", () => {
  const carousel = document.querySelector(".horizontal-carousel");
  let isDown = false;
  let startX;
  let scrollLeft;

  carousel.addEventListener("mousedown", (e) => {
    isDown = true;
    carousel.classList.add("dragging");
    startX = e.pageX - carousel.offsetLeft;
    scrollLeft = carousel.scrollLeft;
  });

  carousel.addEventListener("mouseleave", () => {
    isDown = false;
    carousel.classList.remove("dragging");
  });

  carousel.addEventListener("mouseup", () => {
    isDown = false;
    carousel.classList.remove("dragging");
  });

  carousel.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carousel.offsetLeft;
    const walk = (x - startX) * 1.2; // scroll speed
    carousel.scrollLeft = scrollLeft - walk;
  });
});
