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
   DATA — Flyout menu definitions
═══════════════════════════════════════════════════ */
const MEC_MENUS = {
  study: {
    label: 'Study',
    sections: [
      {
        title: 'Study Materials',
        items: [
          { id: 'classroom', icon: '🏫', label: 'Enter Classroom', hl: true },
          { id: 'study_pq', icon: '📚', label: 'Study Past Questions' },
          { id: 'novel', icon: '📖', label: 'Novel' },
          { id: 'syllabus', icon: '📑', label: 'JAMB Syllabus' },
          { id: 'jamb_brochure', icon: '📋', label: 'JAMB Brochure' },
        ]
      },
      { divider: true },
      {
        title: 'Video Lessons',
        items: [
          { id: 'topic_video', icon: '🎥', label: 'Topic Video Lessons' },
          { id: 'past_q_video', icon: '▶️', label: 'Past Questions Videos' },
        ]
      },
      { divider: true },
      {
        title: 'Opportunities',
        items: [
          { id: 'scholarships', icon: '🎓', label: 'Scholarships' },
        ]
      }
    ]
  },
  test: {
    label: 'Test',
    sections: [
      {
        title: 'Live Challenges',
        items: [
          { id: 'live_arena', icon: '⚔️', label: 'Live Arena', hl: true },
        ]
      },
      { divider: true },
      {
        title: 'JAMB',
        items: [
          { id: 'jamb_cbt', icon: '⏱️', label: 'JAMB CBT Exam' },
          { id: 'jamb_mock', icon: '💰', label: 'JAMB Mock', badge: 'EARNING' },
          { id: 'jamb_trivia', icon: '🎮', label: 'JAMB Trivia', badge: 'EARNING' },
          { id: 'jamb_predicted', icon: '🎯', label: 'JAMB Predicted Questions' },
        ]
      },
      { divider: true },
      {
        title: 'WAEC',
        items: [
          { id: 'waec_cbt', icon: '📝', label: 'WAEC CBT', dim: true, badge: 'SOON' },
          { id: 'waec_trivia', icon: '🧠', label: 'WAEC Trivia', dim: true, badge: 'SOON' },
        ]
      },
      { divider: true },
      {
        title: 'NECO',
        items: [
          { id: 'neco_cbt', icon: '📝', label: 'NECO CBT', dim: true, badge: 'SOON' },
          { id: 'neco_trivia', icon: '🧠', label: 'NECO Trivia', dim: true, badge: 'SOON' },
        ]
      }
    ]
  },
  exam_studio: {
    label: 'Exam Studio',
    sections: [
      {
        title: 'Community',
        items: [
          { id: 'tutor', icon: '👩‍🏫', label: 'Tutor' },
          { id: 'student', icon: '👨‍🎓', label: 'Student' },
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
          { id: 'chat', icon: '💬', label: 'Chat' },
          { id: 'rank', icon: '🏆', label: 'Global Rank' },
          { id: 'friend_score', icon: '👀', label: 'Check Friend Score' },
        ]
      },
      { divider: true },
      {
        title: 'Activity',
        items: [
          { id: 'history', icon: '🕒', label: 'History' },
        ]
      },
      { divider: true },
      {
        title: 'Rewards & Earnings',
        items: [
          { id: 'reward_earnings', icon: '💰', label: 'Earnings', hl: true },
          { id: 'reward_task', icon: '📋', label: 'Task' },
          { id: 'reward_referrals', icon: '🤝', label: 'Referrals' },
        ]
      },
      { divider: true },
      {
        title: 'News & Updates',
        items: [
          { id: 'news_latest', icon: '📰', label: 'Latest Updates', hl: true },
          { id: 'news_admission', icon: '🎓', label: 'Admission News' },
        ]
      }
    ]
  }
};

/* ═══════════════════════════════════════════════════
   HELPERS — Build page href from item id + base path
═══════════════════════════════════════════════════ */
function getModulesBasePath() {
  const path = window.location.pathname;
  if (path.includes('/public/modules/')) {
    return '/public/modules/';
  }
  return '/modules/';
}

function mecHref(base, id) {
  const map = {
    // Core pages
    home: 'index.html',
    exam_hub: 'exam_hub/exam_hub.html',
    ai_tutor: 'AI_study_agent/ai_study_agent.html',
    chat: 'chat/admin_list.html',
    rank: 'rank/rank.html',
    // Study flyout
    classroom: 'study/classroom/classroom_subject.html',
    study_pq: 'study/study_past_questions/study_subject.html',
    novel: 'study/novel/novel.html',
    syllabus: 'study/syllabus/syllabus.html',
    jamb_brochure: 'study/jamb_brochure/jamb_brochure.html',
    topic_video: 'study/topic_video/topic_video.html',
    past_q_video: 'study/past_question_video/past_question_video.html',
    scholarships: 'study/scholarship/list_of_scholarship.html',
    // Test flyout
    live_arena: 'cbt_test/live_quiz_arena/all_subject.html',
    jamb_cbt: 'cbt_test/core/setup.html?exam_id=jamb',
    jamb_mock: 'cbt_test/jamb_mock_exam/mock_date_and_point.html',
    jamb_trivia: 'cbt_test/jamb_triva/jamb_triva_subject.html',
    jamb_predicted: 'cbt_test/jamb_predicted/jamb_predicted.html',
    waec_cbt: 'cbt_test/waec_cbt/waec_cbt.html',
    waec_trivia: 'cbt_test/waec_trivia/waec_trivia.html',
    neco_cbt: 'cbt_test/neco_cbt/neco_cbt.html',
    neco_trivia: 'cbt_test/neco_trivia/neco_trivia.html',
    // Tutor and Student
    tutor: 'exam_hub/tutor/teacher_entry.html',
    student: 'exam_hub/student/all_rooms.html',
    // Reward flyout
    reward_earnings: 'earnings/earnings.html',
    reward_task: 'task/task.html',
    reward_referrals: 'referrals/referrals.html',
    // News flyout
    news_latest: 'news/latest.html',
    news_admission: 'news/admission.html',
    chat_admin: 'chat/chat_admin.html',
    // Activity / New features
    history: '#history',
    friend_score: '#friend_score',
  };
  const rel = map[id];
  if (!rel) return '#';
  return getModulesBasePath() + rel;
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
    this.activeId = this.getAttribute('data-active') || 'home';

    // Register this instance globally so topbar toggle can reach it
    _sidebarInstance = this;

    this._buildOverlay();
    this._buildFlyout();
    this._render();
    this._bindEvents();
    this._initState();

    document.addEventListener('click', this._docClick);
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
      document.body.classList.toggle('sidebar-closed');
      this._closeFlyout();
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
    this.innerHTML = `
      <aside class="mec-sidebar" role="navigation" aria-label="Main navigation">
        <div class="mec-sidebar__nav">

          <!-- Home -->
          <a href="${mecHref(this.base, 'home')}"
             class="mec-sb-item ${this.activeId === 'home' ? 'active' : ''}"
             data-id="home">
            <div class="mec-sb-icon">🏠</div>
            <span class="mec-sb-label">Home</span>
          </a>

          <div class="mec-sb-sep"></div>

          <!-- Study (flyout) -->
          <div class="mec-sb-item ${this.activeId === 'study' ? 'active' : ''}"
               data-flyout="study"
               role="button"
               tabindex="0"
               aria-haspopup="true"
               aria-expanded="false">
            <div class="mec-sb-icon">📚</div>
            <span class="mec-sb-label">Study</span>
            <span class="mec-sb-new">NEW</span>
          </div>

          <!-- Test (flyout) -->
          <div class="mec-sb-item ${this.activeId === 'test' ? 'active' : ''}"
               data-flyout="test"
               role="button"
               tabindex="0"
               aria-haspopup="true"
               aria-expanded="false">
            <div class="mec-sb-icon">📝</div>
            <span class="mec-sb-label">Test</span>
          </div>

          <!-- Exam Studio (flyout) -->
          <div class="mec-sb-item ${this.activeId === 'exam_studio' ? 'active' : ''}"
               data-flyout="exam_studio"
               role="button"
               tabindex="0"
               aria-haspopup="true"
               aria-expanded="false">
            <div class="mec-sb-icon">🏛️</div>
            <span class="mec-sb-label">Exam Studio</span>
          </div>

          <!-- More (flyout) -->
          <div class="mec-sb-item ${this.activeId === 'more' ? 'active' : ''}"
               data-flyout="more"
               role="button"
               tabindex="0"
               aria-haspopup="true"
               aria-expanded="false">
            <div class="mec-sb-icon">•••</div>
            <span class="mec-sb-label">More</span>
          </div>

          <div class="mec-sb-sep"></div>

          <!-- AI Tutor (direct link) -->
          <a href="${mecHref(this.base, 'ai_tutor')}"
             class="mec-sb-item mec-sb-item--accent ${this.activeId === 'ai_tutor' ? 'active' : ''}"
             data-id="ai_tutor">
            <div class="mec-sb-icon">🤖</div>
            <span class="mec-sb-label">AI Tutor</span>
          </a>

        </div>

        <!-- Bottom items -->
        <div class="mec-sidebar__bottom">
          <div class="mec-sb-item mec-sb-item--premium" title="Go Premium">
            <div class="mec-sb-icon">👑</div>
            <span class="mec-sb-label">Premium</span>
          </div>
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

    // Build HTML
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
        const cls = [
          'mec-flyout-item',
          item.hl ? 'mec-flyout-item--hl' : '',
          item.dim ? 'mec-flyout-item--dim' : '',
        ].filter(Boolean).join(' ');

        const href = item.dim ? '#' : mecHref(this.base, item.id);
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

    // Position flyout
    const rect = anchorEl.getBoundingClientRect();
    const SIDEBAR_W = 72;
    const GAP = 8;
    const LEFT = SIDEBAR_W + GAP;

    this.flyout.style.left = LEFT + 'px';
    this.flyout.style.top = '0px'; // reset before measuring
    this.flyout.style.display = 'flex';

    // Use rAF to get the real height after render
    requestAnimationFrame(() => {
      const panelH = this.flyout.offsetHeight;
      let top = rect.top;

      // Keep within viewport
      if (top + panelH > window.innerHeight - 16) {
        top = window.innerHeight - panelH - 16;
      }
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

/* ═══════════════════════════════════════════════════
   SIMPLE & PROFESSIONAL NAVIGATION ALGORITHM
═══════════════════════════════════════════════════ */
(function() {
  document.addEventListener('DOMContentLoaded', () => {
    // We use native browser navigation for reliability in this multi-page architecture,
    // while adding a professional fade-out transition.
    document.body.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;

      const href = a.getAttribute('href');
      
      // Ignore empty, anchor links, external links, or auth links
      if (!href || href === '#' || href.startsWith('http') || a.target === '_blank') {
        return;
      }

      // Allow native navigation but add a smooth UI transition
      const main = document.querySelector('.main-content');
      if (main) {
        main.style.transition = 'opacity 0.2s ease-out';
        main.style.opacity = '0.5';
      }

      // Auto-close sidebar on mobile to prevent it from covering the new page
      if (window.innerWidth <= 600 && _sidebarInstance) {
        // Only close if it's currently open
        if (document.body.classList.contains('sidebar-mobile-open')) {
          _sidebarInstance.toggle();
        }
      }
    });
    
  });
})();
