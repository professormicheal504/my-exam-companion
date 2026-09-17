/**
 * My Exam Companion — App Shell v9
 *
 * Registers TWO custom elements:
 *   <app-topbar data-base="./"> — Top navigation bar
 *   <app-sidebar data-base="./"> — Left icon sidebar with flyout popouts
 *
 * Layout (Chess.com light-theme style):
 *   Topbar: [hamburger | logo]  ....  [search | flag | messages | notifications | profile]
 *   Sidebar: 72px fixed icon strip, slides in/out
 *   Flyout: pops to the right of sidebar on hover (desktop) or tap (mobile)
 */

/* ═══════════════════════════════════════════════════
   CONFIG — Same R2 source as the dashboard
═══════════════════════════════════════════════════ */
const MEC_R2_BASE = 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';

// Resolve the path to new_staging_area relative to sidebar.js location
function _mecR2LocalPath(country) {
  // sidebar.js lives at /components/sidebar.js, staging is at /new_staging_area
  return `/new_staging_area/configs/${country}.json`;
}

async function _loadTestSectionsFromConfig() {
  const country = localStorage.getItem('mec_country') || 'ng';
  let config;
  try {
    const local = await fetch(_mecR2LocalPath(country));
    if (!local.ok) throw new Error('local miss');
    config = await local.json();
  } catch {
    const remote = await fetch(`${MEC_R2_BASE}/configs/${country}.json`);
    if (!remote.ok) return null;
    config = await remote.json();
  }
  return config;
}

/* ═══════════════════════════════════════════════════
   DATA — Flyout menu definitions
═══════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════
   FLYOUT ICONS — Lucide SVGs, stroke="currentColor"
   All icons inherit colour from the flyout item CSS.
═══════════════════════════════════════════════════ */
const _svg = (d) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

const FLYOUT_IC = {
  // ── Study
  classroom: _svg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
  study_pq: _svg('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
  novel: _svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>'),
  syllabus: _svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),
  brochure: _svg('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
  topic_video: _svg('<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>'),
  past_q_video: _svg('<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>'),
  scholarships: _svg('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>'),
  // ── Test
  live_arena: _svg('<path d="m14.5 12.5-5-3v6l5-3z"/><circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.81-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>'),
  jamb_mock: _svg('<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>'),
  secondary: _svg('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
  cbt_exam: _svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>'),
  post_utme: _svg('<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>'),
  university: _svg('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>'),
  // ── Exam Studio
  tutor: _svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  student: _svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  // ── More
  wallet: _svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0z"/><path d="M2 10h20"/>'),
  chat: _svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),  
  rank: _svg('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>'),
  friend_score: _svg('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
  history: _svg('<polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-3m-.5 3V8m0 3H6"/>'),
  earnings: _svg('<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
  task: _svg('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
  referrals: _svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>'),
  news: _svg('<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6z"/>'),
  admission: _svg('<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>'),
};

const MEC_MENUS = {
  study: {
    label: 'Study',
    sections: [
      {
        title: 'Study Materials',
        items: [
          { id: 'classroom', icon: FLYOUT_IC.classroom, label: 'Enter Classroom', hl: true },
          { id: 'novel', icon: FLYOUT_IC.novel, label: 'Novel' },
          { id: 'syllabus', icon: FLYOUT_IC.syllabus, label: 'JAMB Syllabus' },
          { id: 'brochure', icon: FLYOUT_IC.brochure, label: 'Brochure' },
        ]
      },
      { divider: true },
      {
        title: 'Video Lessons',
        items: [
          { id: 'topic_video', icon: FLYOUT_IC.topic_video, label: 'Topic Video Lessons' },
        ]
      }
    ]
  },
  test: {
    label: 'Test',
    sections: []
  },
  exam_studio: {
    label: 'Exam Studio',
    sections: [
      {
        title: 'Community',
        items: [
          { id: 'tutor', icon: FLYOUT_IC.tutor, label: 'Tutor', dim: true },
          { id: 'student', icon: FLYOUT_IC.student, label: 'Student', dim: true },
        ]
      }
    ]
  },
  more: {
    label: 'More Options',
    sections: [
      {
        title: 'Community',
        items: [
          { id: 'chat', icon: FLYOUT_IC.chat, label: 'Chat', dim: true },
          { id: 'rank', icon: FLYOUT_IC.rank, label: 'Global Rank' },
        ]
      },
      { divider: true },
      {
        title: 'Wallet',
        items: [
          { id: 'top_up', icon: FLYOUT_IC.wallet, label: 'Top Up Wallet', hl: true },
        ]
      },
      { divider: true },
      {
        title: 'Rewards & Earnings',
        items: [
          { id: 'reward_earnings', icon: FLYOUT_IC.earnings, label: 'Earnings', hl: true },
          { id: 'reward_task', icon: FLYOUT_IC.task, label: 'Task' },
          { id: 'reward_referrals', icon: FLYOUT_IC.referrals, label: 'Referrals' },
        ]
      },
    ]
  }
};

/* ═══════════════════════════════════════════════════
   HELPERS — Delegated to MEC_NAV (nav.js)
   mecHref and getModulesBasePath are kept as shims
   for backwards compatibility with any legacy code.
   All new code should use MEC_NAV.href(id, params).
═══════════════════════════════════════════════════ */
function _mecHrefSafe(id, params) {
  // MEC_NAV is loaded before sidebar.js via <script> order.
  // This guard makes the sidebar safe even if nav.js is missing.
  if (window.MEC_NAV) return window.MEC_NAV.href(id, params);
  console.warn('[sidebar] MEC_NAV not loaded — href() fell back to #');
  return '#';
}

/* ═══════════════════════════════════════════════════
   SHARED STATE — so topbar toggle can control sidebar
═══════════════════════════════════════════════════ */
let _sidebarInstance = null;

function mecToggleSidebar() {
  if (_sidebarInstance) _sidebarInstance.toggle();
}


/* ═══════════════════════════════════════════════════
   <app-sidebar> — 72px icon strip + flyout popouts
═══════════════════════════════════════════════════ */
class AppSidebar extends HTMLElement {

  constructor() {
    super();
    this.base = '';
    this.activeId = '';
    this.openMenuId = null;
    this.flyout = null;
    this.overlay = null;
    this._docClick = this._docClick.bind(this);
  }

  connectedCallback() {
    this.base = this.getAttribute('data-base') || './';
    
    // Auto-fix this.base if it is absolute '/' but we are inside '/public/' (e.g., Live Server or file://)
    if (this.base === '/') {
      const path = window.location.pathname;
      const publicIdx = path.indexOf('/public/');
      if (publicIdx !== -1) {
        if (window.location.protocol === 'file:') {
          this.base = 'file://' + path.substring(0, publicIdx + 8);
        } else {
          this.base = path.substring(0, publicIdx + 8);
        }
      }
    }

    // Auto-detect the active section from the current URL via MEC_NAV.
    // Falls back to the data-active attribute, then to 'home'.
    if (window.MEC_NAV) {
      this.activeId = window.MEC_NAV.getActiveSection();
      // Top-up pages live under section 'more' in the route registry, which would
      // highlight the "More" flyout button. Override to 'top_up' so the dedicated
      // "Top Up" bottom item is highlighted instead.
      const _topUpPageIds = ['top_up', 'top_up_amount', 'top_up_checkout'];
      if (_topUpPageIds.includes(window.MEC_NAV.getActivePageId())) {
        this.activeId = 'top_up';
      }
    } else {
      this.activeId = this.getAttribute('data-active') || 'home';
    }

    // Register this instance globally so topbar toggle can reach it
    _sidebarInstance = this;

    this._buildOverlay();
    this._buildFlyout();
    this._render();
    this._bindEvents();
    this._initState();

    document.addEventListener('click', this._docClick);

    // Listen for nav.js close-sidebar events (triggered by link interceptor)
    document.addEventListener('mec-close-sidebar', () => {
      if (document.body.classList.contains('sidebar-mobile-open')) {
        this._closeMobile();
      }
    });
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._docClick);
    _sidebarInstance = null;
    this.flyout?.remove();
    this.overlay?.remove();
  }

  /* ── State ─────────────────────────────────────── */
  _initState() {
    if (window.innerWidth <= 600) {
      // Mobile: closed by default
      document.body.classList.remove('sidebar-mobile-open');
    } else {
      // Desktop: open by default
      document.body.classList.remove('sidebar-closed');
    }
  }

  toggle() {
    if (window.innerWidth <= 600) {
      const open = document.body.classList.contains('sidebar-mobile-open');
      if (open) {
        this._closeMobile();
      } else {
        this._openMobile();
      }
    } else {
      // On desktop and tablet, sidebar is fixed. 
      // Clicking the logo (which acts as the toggle) navigates home instead.
      if (window.MEC_NAV && typeof window.MEC_NAV.href === 'function') {
        window.location.href = window.MEC_NAV.href('home');
      } else {
        // Fallback to home
        window.location.href = window.MEC_NAV.href('home');
      }
    }
  }

  _openMobile() {
    document.body.classList.add('sidebar-mobile-open');
    this.overlay.classList.add('active');
  }

  _closeMobile() {
    document.body.classList.remove('sidebar-mobile-open');
    this.overlay.classList.remove('active');
    this._closeFlyout();
  }

  /* ── Build DOM ─────────────────────────────────── */
  _buildOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'mec-sb-overlay';
    document.body.appendChild(this.overlay);
    this.overlay.addEventListener('click', () => {
      this._closeMobile();
    });
  }

  _buildFlyout() {
    this.flyout = document.createElement('div');
    this.flyout.className = 'mec-flyout';
    document.body.appendChild(this.flyout);

    // Hovering flyout on desktop keeps it open
    this.flyout.addEventListener('mouseenter', () => {
      if (window.innerWidth > 600) {
        clearTimeout(this._flyoutCloseTimer);
      }
    });
    this.flyout.addEventListener('mouseleave', () => {
      if (window.innerWidth > 600) {
        this._flyoutCloseTimer = setTimeout(() => this._closeFlyout(), 120);
      }
    });
  }

  _render() {
    const _h = (id, params) => _mecHrefSafe(id, params);
    const _active = (id) => this.activeId === id ? 'active' : '';

    /* ── Lucide SVG icons (stroke="currentColor" — inherits CSS color) ── */
    const IC = {
      home: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      study: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
      test: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`,
      exam_studio: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
      blog: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 0-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6z"/></svg>`,
      more: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
      ai_tutor: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect x="2" y="8" width="20" height="12" rx="2"/><path d="M6 8v4"/><path d="M18 8v4"/><path d="M8 16h8"/></svg>`,
      topup: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>`,
      pricing: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
    };

    this.innerHTML = `
      <aside class="mec-sidebar" role="navigation" aria-label="Main navigation">
        <div class="mec-sidebar__nav">

          <!-- Home -->
          <a href="${_h('home')}"
             class="mec-sb-item ${_active('home')}"
             data-id="home">
            <div class="mec-sb-icon">${IC.home}</div>
            <span class="mec-sb-label">Home</span>
          </a>

          <div class="mec-sb-sep"></div>

          <!-- Study (flyout) -->
          <div class="mec-sb-item ${_active('study')}"
               data-flyout="study"
               role="button"
               tabindex="0"
               aria-haspopup="true"
               aria-expanded="false">
            <div class="mec-sb-icon">${IC.study}</div>
            <span class="mec-sb-label">Study</span>
            <span class="mec-sb-new">NEW</span>
          </div>

          <!-- Test (flyout) -->
          <div class="mec-sb-item ${_active('test')}"
               data-flyout="test"
               role="button"
               tabindex="0"
               aria-haspopup="true"
               aria-expanded="false">
            <div class="mec-sb-icon">${IC.test}</div>
            <span class="mec-sb-label">Test</span>
          </div>

          <!-- Exam Studio (flyout) -->
          <div class="mec-sb-item ${_active('exam_studio')}"
               data-flyout="exam_studio"
               role="button"
               tabindex="0"
               aria-haspopup="true"
               aria-expanded="false">
            <div class="mec-sb-icon">${IC.exam_studio}</div>
            <span class="mec-sb-label">Exam Studio</span>
          </div>

          <!-- Blog (direct link) -->
          <a href="${_h('blog')}"
             class="mec-sb-item ${_active('blog')}"
             data-id="blog">
            <div class="mec-sb-icon">${IC.blog}</div>
            <span class="mec-sb-label">Blog</span>
          </a>

          <!-- More (flyout) -->
          <div class="mec-sb-item ${_active('more')}"
               data-flyout="more"
               role="button"
               tabindex="0"
               aria-haspopup="true"
               aria-expanded="false">
            <div class="mec-sb-icon">${IC.more}</div>
            <span class="mec-sb-label">More</span>
          </div>

          <div class="mec-sb-sep"></div>

          <!-- AI Tutor (direct link) -->
          <a href="${_h('ai_tutor')}"
             class="mec-sb-item mec-sb-item--accent ${_active('ai_tutor')}"
             data-id="ai_tutor">
            <div class="mec-sb-icon">${IC.ai_tutor}</div>
            <span class="mec-sb-label">AI Tutor</span>
          </a>

        </div>

        <!-- Bottom items -->
        <div class="mec-sidebar__bottom">
          <a href="${_h('pricing')}"
             class="mec-sb-item ${_active('pricing')}"
             data-id="pricing"
             title="Pricing">
            <div class="mec-sb-icon">${IC.pricing}</div>
            <span class="mec-sb-label">Pricing</span>
          </a>
          <a href="${_h('top_up')}"
             class="mec-sb-item mec-sb-item--topup ${_active('top_up')}"
             data-id="top_up"
             title="Top Up Wallet">
            <div class="mec-sb-icon">${IC.topup}</div>
            <span class="mec-sb-label">Top Up</span>
          </a>
        </div>
      </aside>
    `;
  }

  /* ── Events ────────────────────────────────────── */
  _bindEvents() {
    // Flyout triggers
    this.querySelectorAll('[data-flyout]').forEach(el => {
      const menuId = el.getAttribute('data-flyout');

      // Click / tap
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.openMenuId === menuId) {
          this._closeFlyout();
        } else {
          this._openFlyout(menuId, el);
        }
      });

      // Keyboard
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._openFlyout(menuId, el);
        }
      });

      // Desktop hover
      el.addEventListener('mouseenter', () => {
        if (window.innerWidth > 600) {
          clearTimeout(this._flyoutCloseTimer);
          this._openFlyout(menuId, el);
        }
      });
      el.addEventListener('mouseleave', () => {
        if (window.innerWidth > 600) {
          this._flyoutCloseTimer = setTimeout(() => {
            if (!this.flyout.matches(':hover')) {
              this._closeFlyout();
            }
          }, 120);
        }
      });
    });

    // Resize handler
    window.addEventListener('resize', () => {
      this._closeFlyout();
      if (window.innerWidth > 600) {
        document.body.classList.remove('sidebar-mobile-open');
        this.overlay.classList.remove('active');
      }
    });

    // Re-render menu when country changes
    document.addEventListener('country-changed', () => {
      if (this.openMenuId === 'test') {
        this._closeFlyout();
      }
    });
  }

  _docClick(e) {
    if (!this.contains(e.target) && !this.flyout.contains(e.target)) {
      this._closeFlyout();
    }
  }

  /* ── Flyout ────────────────────────────────────── */
  _openFlyout(menuId, anchorEl) {
    const menu = MEC_MENUS[menuId];
    if (!menu) return;
    this.openMenuId = menuId;

    // Mark anchor as active
    this.querySelectorAll('[data-flyout]').forEach(el => {
      el.setAttribute('aria-expanded', el.getAttribute('data-flyout') === menuId ? 'true' : 'false');
      el.classList.toggle('active', el.getAttribute('data-flyout') === menuId);
    });

    // Position flyout (show immediately)
    const rect = anchorEl.getBoundingClientRect();
    const LEFT = 72 + 8;
    this.flyout.style.left = LEFT + 'px';
    this.flyout.style.top = '0px';
    this.flyout.style.display = 'flex';

    if (menuId === 'test') {
      this.flyout.innerHTML = `<div style="padding:20px 16px;color:#9ca3af;font-size:13px;">Loading exams...</div>`;
      this.flyout.classList.add('open');

      const _country = localStorage.getItem('mec_country') || 'ng';
      const _isNg = _country === 'ng';

      _loadTestSectionsFromConfig().then(config => {
        let html = `<div class="mec-flyout-title">Live Challenges</div>`;
        // Live Arena — Coming Soon for everyone
        html += `<div class="mec-flyout-item mec-flyout-item--dim" style="cursor:default;">`;
        html += `<div class="mec-flyout-icon">${FLYOUT_IC.live_arena}</div><span>Live Arena</span>`;
        html += `<span class="mec-flyout-soon">COMING SOON</span></div>`;

        // JAMB Mock — Nigeria only
        if (_isNg) {
          html += `<div class="mec-flyout-div"></div>`;
          html += `<a href="${_mecHrefSafe('jamb_mock')}" class="mec-flyout-item">`;
          html += `<div class="mec-flyout-icon">${FLYOUT_IC.jamb_mock}</div><span>JAMB Mock Exam</span></a>`;
        }

        if (config && config.dashboard_modules && config.dashboard_modules.length) {
          const filteredModules = config.dashboard_modules.filter(m => m.category !== 'university');
          
          const regularExams = filteredModules.filter(m => m.renderer !== 'cbt_premium_engine' || !m.data_source.includes('post_utme'));
          const hasPostUtme = filteredModules.some(m => m.renderer === 'cbt_premium_engine' && m.data_source.includes('post_utme'));

          regularExams.forEach((mod, i) => {
            if (i === 0) html += `<div class="mec-flyout-div"></div>`;
            const params = { exam_id: mod.id };
            if (mod.data_source) params.data_source = mod.data_source;
            if (mod.logo) params.logo = mod.logo;
            html += `<a href="${_mecHrefSafe('cbt_setup', params)}" class="mec-flyout-item">`;
            html += `<div class="mec-flyout-icon">${FLYOUT_IC.cbt_exam}</div>`;
            html += `<span>${mod.display_name} CBT Exam</span>`;
            html += `</a>`;
            if (i < regularExams.length - 1) html += `<div class="mec-flyout-div"></div>`;
          });

          if (hasPostUtme) {
            html += `<div class="mec-flyout-div"></div>`;
            html += `<a href="${_mecHrefSafe('post_utme')}" class="mec-flyout-item">`;
            html += `<div class="mec-flyout-icon">${FLYOUT_IC.post_utme}</div>`;
            html += `<span>Post UTME</span>`;
            html += `</a>`;
          }
        }

        // University Exam — Nigeria only
        if (_isNg) {
          html += `<div class="mec-flyout-div"></div>`;
          html += `<a href="${_mecHrefSafe('university_exam')}" class="mec-flyout-item">`;
          html += `<div class="mec-flyout-icon">${FLYOUT_IC.university}</div><span>University CBT/Theory Exam</span></a>`;
        }

        html += `<div class="mec-flyout-div"></div>`;
        html += `<a href="${_mecHrefSafe('leaderboard')}" class="mec-flyout-item">`;
        html += `<div class="mec-flyout-icon">${FLYOUT_IC.rank}</div><span>Leaderboard</span></a>`;

        html += `<div class="mec-flyout-div"></div>`;
        html += `<a href="${_mecHrefSafe('history')}" class="mec-flyout-item">`;
        html += `<div class="mec-flyout-icon">${FLYOUT_IC.history}</div><span>History</span></a>`;

        this.flyout.innerHTML = html;
        requestAnimationFrame(() => {
          const panelH = this.flyout.offsetHeight;
          let top = rect.top;
          if (top + panelH > window.innerHeight - 16) top = window.innerHeight - panelH - 16;
          if (top < 64) top = 64;
          this.flyout.style.top = top + 'px';
        });
      }).catch(() => {
        this.flyout.innerHTML = `<div style="padding:16px;color:#ef4444;font-size:12px;">Failed to load exams</div>`;
      });
      return;
    }

    // Build HTML for non-test menus
    let html = '';
    menu.sections.forEach(section => {
      if (section.divider) {
        html += `<div class="mec-flyout-div"></div>`;
        return;
      }
      if (section.title) {
        html += `<div class="mec-flyout-title">${section.title}</div>`;
      }
      section.items.forEach(item => {
        const currentCountry = localStorage.getItem('mec_country') || 'ng';
        if (currentCountry !== 'ng' && (item.id === 'syllabus' || item.id === 'brochure' || item.id === 'novel')) {
          return;
        }

        const cls = [
          'mec-flyout-item',
          item.hl ? 'mec-flyout-item--hl' : '',
          item.dim ? 'mec-flyout-item--dim' : '',
        ].filter(Boolean).join(' ');
        const href = item.dim ? '#' : _mecHrefSafe(item.id);
        const tag = item.dim ? 'div' : 'a';
        const hrefAttr = item.dim ? '' : `href="${href}"`;
        html += `
          <${tag} ${hrefAttr} class="${cls}">
            <div class="mec-flyout-icon">${item.icon}</div>
            <span>${item.label}</span>
            ${item.badge ? `<span class="mec-flyout-soon">${item.badge}</span>` : ''}
          </${tag}>
        `;
      });
    });
    this.flyout.innerHTML = html;

    requestAnimationFrame(() => {
      const panelH = this.flyout.offsetHeight;
      let top = rect.top;
      if (top + panelH > window.innerHeight - 16) top = window.innerHeight - panelH - 16;
      if (top < 64) top = 64;
      this.flyout.style.top = top + 'px';
      this.flyout.classList.add('open');
    });
  }

  _closeFlyout() {
    this.openMenuId = null;
    this.flyout.classList.remove('open');
    this.querySelectorAll('[data-flyout]').forEach(el => {
      el.setAttribute('aria-expanded', 'false');
      // Restore active state only if it matches the page's active id
      const fid = el.getAttribute('data-flyout');
      el.classList.toggle('active', fid === this.activeId);
    });
  }
}

/* ═══════════════════════════════════════════════════
   REGISTER custom elements
═══════════════════════════════════════════════════ */
customElements.define('app-sidebar', AppSidebar);

/*
  Navigation (link interception, transitions, guards) is now
  handled entirely by nav.js (MEC_NAV). No duplicate logic here.
*/
