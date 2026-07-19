// Scroll reveal (progressive enhancement fade-in on sections).
// Only activated when IntersectionObserver exists and the user has no
// "prefers-reduced-motion" preference. Otherwise sections stay fully
// visible (no CSS hides them unless html.js-reveal-ready is present).
(function setupScrollReveal() {
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('js-reveal-ready');

  const revealEls = document.querySelectorAll('.reveal-on-scroll');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
  );

  revealEls.forEach((el) => observer.observe(el));
})();

// Theme handling: the day/night button only ever switches light <-> dark.
// The Bloomberg "terminal" theme is a special option living inside the
// settings panel (next to the accent swatches), not in this button's cycle.
const ACCENT_VARS = [
  '--c-accent', '--c-accent-2', '--c-accent-3', '--c-accent-soft',
  '--c-accent-a08', '--c-accent-a10', '--c-accent-a15', '--c-accent-a20',
  '--c-accent-a25', '--c-accent-a30', '--c-accent-a40',
];

function refreshActiveSwatch() {
  const panel = document.getElementById('settings-panel');
  if (!panel) return;
  const key = document.documentElement.getAttribute('data-theme') === 'terminal'
    ? 'terminal'
    : (localStorage.getItem('accent') || 'blue');
  panel.querySelectorAll('.accent-swatch').forEach((sw) => {
    sw.classList.toggle('active', sw.dataset.accent === key);
  });
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
  localStorage.setItem('theme', theme);
  if (theme !== 'terminal') {
    // Remember the last "real" light/dark state so we can restore it
    // if the user picks a normal accent color while terminal mode is on.
    localStorage.setItem('themeBeforeTerminal', theme);
  }

  const root = document.documentElement.style;
  if (theme === 'terminal') {
    // Let the terminal theme's own CSS-defined orange accent show through
    // instead of any custom accent color the user previously picked.
    ACCENT_VARS.forEach((v) => root.removeProperty(v));
  } else {
    const savedAccent = localStorage.getItem('accent');
    if (savedAccent) applyAccent(savedAccent);
  }
  refreshActiveSwatch();
}

const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
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

  refreshActiveSwatch();

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
      if (key === 'terminal') {
        applyTheme('terminal');
      } else {
        applyAccent(key);
        localStorage.setItem('accent', key);
        if (document.documentElement.getAttribute('data-theme') === 'terminal') {
          // Picking a normal color while in terminal mode exits terminal mode.
          applyTheme(localStorage.getItem('themeBeforeTerminal') || 'light');
        } else {
          refreshActiveSwatch();
        }
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!settingsPanel.contains(e.target) && e.target !== settingsToggleBtn) {
      closePanel();
    }
  });
}

// ETF ticker banner
// Get a free API key (instant, no credit card) at https://finnhub.io/register
// and paste it below. Free tier: 60 calls/minute, plenty for a portfolio site.
const FINNHUB_API_KEY = 'd9e81ohr01qh241atm8gd9e81ohr01qh241atm90';

const etfTickerTrack = document.getElementById('etf-ticker-track');
if (etfTickerTrack) {
  const isFrenchPage = location.pathname.includes('_fr');
  const etfList = [
    { symbol: 'SPY', label: 'S&P 500' },
    { symbol: 'QQQ', label: 'Nasdaq 100' },
    { symbol: 'EFA', label: 'MSCI EAFE' },
    { symbol: 'EWQ', label: 'MSCI France' },
    { symbol: 'GLD', label: isFrenchPage ? 'Or' : 'Gold' },
    { symbol: 'TLT', label: 'US Treasury 20y+' },
  ];

  const CACHE_KEY = 'etfTickerData';
  const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function renderTicker(items) {
    etfTickerTrack.innerHTML = '';
    const buildSet = () => {
      const frag = document.createDocumentFragment();
      items.forEach((item) => {
        const el = document.createElement('span');
        el.className = 'etf-ticker-item';
        const isUp = item.change >= 0;
        el.dataset.symbol = item.symbol;
        el.innerHTML = `
          <span class="etf-symbol">${escapeHtml(item.symbol)}</span>
          <span class="etf-label">${escapeHtml(item.label)}</span>
          <span class="etf-price">${item.price != null ? item.price.toFixed(2) : '—'}</span>
          <span class="etf-change ${isUp ? 'etf-up' : 'etf-down'}">${isUp ? '▲' : '▼'} ${Math.abs(item.change).toFixed(2)}%</span>
        `;
        frag.appendChild(el);
      });
      return frag;
    };
    etfTickerTrack.appendChild(buildSet());
    etfTickerTrack.appendChild(buildSet()); // duplicate for a seamless scroll loop
  }

  function renderMessage(message) {
    etfTickerTrack.innerHTML = `<span class="etf-ticker-item etf-ticker-message">${escapeHtml(message)}</span>`;
  }

  async function fetchEtfData() {
    if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'YOUR_FINNHUB_API_KEY') return null;
    try {
      const results = await Promise.all(
        etfList.map(async (item) => {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${item.symbol}&token=${FINNHUB_API_KEY}`);
          if (!res.ok) throw new Error('bad response');
          const json = await res.json();
          return { ...item, price: typeof json.c === 'number' && json.c > 0 ? json.c : null, change: json.dp || 0 };
        })
      );
      return results.some((r) => r.price != null) ? results : null;
    } catch (e) {
      return null;
    }
  }

  // --- Sparkline trend history ---
  // Finnhub's historical candle endpoint (/stock/candle) requires a paid
  // plan and returns "You don't have access to this resource" on the free
  // tier used here. Instead we accumulate our own trend client-side: every
  // time a fresh (non-cached) quote is fetched, we append a snapshot per
  // symbol to localStorage, capped in size and spaced out in time. Over
  // repeat visits this builds a real trend for the "au survol" sparkline,
  // even though it won't be a full 7 days deep on the very first visit.
  const HISTORY_KEY = 'etfHistory';
  const HISTORY_MIN_GAP_MS = 60 * 60 * 1000; // don't record more than once/hour per symbol
  const HISTORY_MAX_POINTS = 168; // ~7 days at one point/hour

  function readHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function recordHistory(results) {
    try {
      const history = readHistory();
      const now = Date.now();
      results.forEach((item) => {
        if (item.price == null) return;
        const points = history[item.symbol] || [];
        const last = points[points.length - 1];
        if (!last || now - last.t >= HISTORY_MIN_GAP_MS) {
          points.push({ t: now, p: item.price });
          if (points.length > HISTORY_MAX_POINTS) points.splice(0, points.length - HISTORY_MAX_POINTS);
        }
        history[item.symbol] = points;
      });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      /* ignore quota/storage errors */
    }
  }

  function buildSparklineSVG(points) {
    if (!points || points.length < 2) return null;
    const width = 74;
    const height = 24;
    const pad = 2;
    const prices = points.map((pt) => pt.p);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const step = (width - pad * 2) / (points.length - 1);
    const coords = points
      .map((pt, i) => {
        const x = pad + i * step;
        const y = height - pad - ((pt.p - min) / range) * (height - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    const isUp = prices[prices.length - 1] >= prices[0];
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true">
      <polyline class="etf-spark-line ${isUp ? 'etf-spark-up' : 'etf-spark-down'}" points="${coords}" />
    </svg>`;
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
      /* ignore quota/storage errors */
    }
  }

  async function loadTicker({ forceRefresh = false } = {}) {
    const cached = readCache();
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      renderTicker(cached.data);
      return;
    }

    const fresh = await fetchEtfData();
    if (fresh) {
      writeCache(fresh);
      recordHistory(fresh);
      renderTicker(fresh);
    } else if (cached) {
      renderTicker(cached.data); // stale but better than nothing
    } else {
      renderMessage(isFrenchPage ? 'Données de marché indisponibles pour le moment' : 'Market data unavailable right now');
    }
  }

  loadTicker();

  setInterval(() => {
    if (!document.hidden) loadTicker({ forceRefresh: true });
  }, REFRESH_INTERVAL_MS);

  // --- Sparkline hover tooltip ---
  // Delegated on the track (items get rebuilt on every render), rendered
  // as a position:fixed element on <body> so it escapes .etf-ticker's
  // overflow:hidden (needed for the scrolling marquee effect).
  let sparkTooltipEl = null;

  function hideSparkTooltip() {
    if (sparkTooltipEl) {
      sparkTooltipEl.remove();
      sparkTooltipEl = null;
    }
  }

  function showSparkTooltip(itemEl, symbol) {
    const history = readHistory();
    const points = history[symbol] || [];
    const svg = buildSparklineSVG(points);
    const caption = svg
      ? (isFrenchPage ? `Tendance (${points.length} pts)` : `Trend (${points.length} pts)`)
      : (isFrenchPage ? 'Historique en cours de constitution…' : 'Building trend history…');

    hideSparkTooltip();
    const tooltip = document.createElement('div');
    tooltip.className = 'etf-spark-tooltip';
    tooltip.innerHTML = `${svg || ''}<span class="etf-spark-caption">${escapeHtml(caption)}</span>`;
    document.body.appendChild(tooltip);

    const rect = itemEl.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    let left = rect.left + rect.width / 2;
    left = Math.max(tipRect.width / 2 + 8, Math.min(left, window.innerWidth - tipRect.width / 2 - 8));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${rect.bottom + 8}px`;

    sparkTooltipEl = tooltip;
  }

  etfTickerTrack.addEventListener('mouseover', (e) => {
    const item = e.target.closest('.etf-ticker-item');
    if (item && item.dataset.symbol) showSparkTooltip(item, item.dataset.symbol);
  });

  etfTickerTrack.addEventListener('mouseout', (e) => {
    const item = e.target.closest('.etf-ticker-item');
    const toItem = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.etf-ticker-item');
    if (item && item !== toItem) hideSparkTooltip();
  });

  etfTickerTrack.addEventListener('scroll', hideSparkTooltip);
  window.addEventListener('scroll', hideSparkTooltip, { passive: true });
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

// Bloomberg terminal easter egg: a tiny fake CLI, only visible/relevant
// while data-theme="terminal" is active (see .cli-section in layout.css).
const cliInput = document.getElementById('cli-input');
const cliOutput = document.getElementById('cli-output');
if (cliInput && cliOutput) {
  const isFrCli = location.pathname.includes('_fr');
  const CLI_PROMPT = 'camille@portfolio:~$';

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const cliCommands = isFrCli ? {
    help: () => [
      'Commandes disponibles :',
      '  whoami       - qui suis-je',
      '  skills       - compétences techniques',
      '  projects     - voir les projets',
      '  experience   - voir les stages',
      '  education    - parcours académique',
      '  contact      - me contacter',
      '  clear        - vider le terminal',
    ],
    whoami: () => ['Camille Auvity — étudiant en data science & ingénierie IA.', 'Triple diplôme : MEng & MiM & MiFEng.'],
    skills: () => ['Python, SQL, Machine Learning, séries temporelles, modélisation financière, dataviz.'],
    projects: () => { scrollToId('my-work-section'); return ['→ direction la section projets...']; },
    experience: () => { scrollToId('internships-section'); return ['→ direction la section stages...']; },
    education: () => { scrollToId('studies-section'); return ['→ direction la section éducation...']; },
    contact: () => { scrollToId('contacts-section'); return ['Email: caauvity@orange.fr', 'LinkedIn: /camille-auvity', 'GitHub: @camille-auvity']; },
    sudo: () => ['Belle tentative. Permission refusée 😄'],
    date: () => [new Date().toString()],
    ls: () => ['about  education  experience  projects  contact'],
  } : {
    help: () => [
      'Available commands:',
      '  whoami       - who this site is about',
      '  skills       - technical skills',
      '  projects     - jump to the projects section',
      '  experience   - jump to work experience',
      '  education    - jump to education',
      '  contact      - how to reach me',
      '  clear        - clear the terminal',
    ],
    whoami: () => ['Camille Auvity — Data Science & AI Engineering student.', 'Triple degree: MEng & MiM & MiFEng.'],
    skills: () => ['Python, SQL, Machine Learning, time series, financial modeling, data viz.'],
    projects: () => { scrollToId('my-work-section'); return ['→ scrolling to projects...']; },
    experience: () => { scrollToId('internships-section'); return ['→ scrolling to experience...']; },
    education: () => { scrollToId('studies-section'); return ['→ scrolling to education...']; },
    contact: () => { scrollToId('contacts-section'); return ['Email: caauvity@orange.fr', 'LinkedIn: /camille-auvity', 'GitHub: @camille-auvity']; },
    sudo: () => ['Nice try. Permission denied 😄'],
    date: () => [new Date().toString()],
    ls: () => ['about  education  experience  projects  contact'],
  };

  function cliPrintLine(text, isCommand) {
    const line = document.createElement('div');
    line.className = isCommand ? 'cli-line cli-line-command' : 'cli-line';
    line.textContent = text;
    cliOutput.appendChild(line);
    cliOutput.scrollTop = cliOutput.scrollHeight;
  }

  function cliRun(raw) {
    cliPrintLine(`${CLI_PROMPT} ${raw}`, true);
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    if (cmd === 'clear') {
      cliOutput.innerHTML = '';
      return;
    }
    const handler = cliCommands[cmd];
    if (handler) {
      handler().forEach((line) => cliPrintLine(line));
    } else {
      cliPrintLine(isFrCli ? `commande introuvable : ${cmd} (essayez "help")` : `command not found: ${cmd} (try "help")`);
    }
  }

  cliPrintLine(isFrCli ? 'Tapez "help" pour la liste des commandes.' : 'Type "help" to see available commands.');

  cliInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = cliInput.value;
      if (val.trim() !== '') cliRun(val);
      cliInput.value = '';
    }
  });

  const cliWidget = document.getElementById('cli-widget');
  if (cliWidget) {
    cliWidget.addEventListener('click', () => cliInput.focus());
  }
}
