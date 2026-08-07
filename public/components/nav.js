/**
 * My Exam Companion — Navigation Algorithm (nav.js) v1.0
 * =========================================================
 *
 * Single source of truth for ALL navigation in the app.
 *
 * Exposes: window.MEC_NAV
 *
 * API:
 *   MEC_NAV.href(id, params?)         → full URL string
 *   MEC_NAV.go(id, params?)           → navigate with transition
 *   MEC_NAV.getActiveSection()        → sidebar section id from current URL
 *   MEC_NAV.getActivePageId()         → exact page id from current URL
 *   MEC_NAV.guard(fn)                 → register a nav guard function
 *   MEC_NAV.resolveBase()             → compute correct /modules/ base path
 *   MEC_NAV.breadcrumb()              → array of {id, label, href} for current page
 */

(function (global) {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     1. ROUTE REGISTRY
     Every page in the app is described here exactly once.
     Structure:
       id       → unique route identifier (used everywhere in code)
       path     → path relative to /modules/
       section  → which sidebar section this page belongs to
       label    → human-readable name
       params   → list of accepted URL query params (for documentation)
       guard?   → 'auth' if the page requires login
  ═══════════════════════════════════════════════════════════════ */
  const ROUTES = [
    // ── Home ──────────────────────────────────────────────────
    {
      id: 'home',
      path: 'index.html',
      section: 'home',
      label: 'Home',
    },

    // ── Study ─────────────────────────────────────────────────
    {
      id: 'classroom',
      path: 'study/classroom/classroom_subject.html',
      section: 'study',
      label: 'Enter Classroom',
    },
    {
      id: 'classroom_explanation',
      path: 'study/classroom/classroom_explanation.html',
      section: 'study',
      label: 'Classroom Explanation',
      params: ['subject', 'topic'],
    },
    {
      id: 'classroom_questions',
      path: 'study/classroom/classroom_questions.html',
      section: 'study',
      label: 'Classroom Questions',
      params: ['subject', 'topic'],
    },
    {
      id: 'study_pq',
      path: 'study/study_past_questions/study_subject.html',
      section: 'study',
      label: 'Study Past Questions',
    },
    {
      id: 'study_past_questions',
      path: 'study/study_past_questions/study_past_questions.html',
      section: 'study',
      label: 'Study Past Questions Player',
      params: ['subject', 'year'],
    },
    {
      id: 'study_explanation',
      path: 'study/study_past_questions/study_explanation.html',
      section: 'study',
      label: 'Study Explanation',
      params: ['subject', 'year', 'q'],
    },
    {
      id: 'novel',
      path: 'study/novel/novel.html',
      section: 'study',
      label: 'Novel',
    },
    {
      id: 'syllabus',
      path: 'study/syllabus/syllabus.html',
      section: 'study',
      label: 'JAMB Syllabus',
    },
    {
      id: 'jamb_brochure',
      path: 'study/jamb_brochure/jamb_brochure.html',
      section: 'study',
      label: 'JAMB Brochure',
    },
    {
      id: 'topic_video',
      path: 'study/topic_video/topic_video.html',
      section: 'study',
      label: 'Topic Video Lessons',
    },
    {
      id: 'past_q_video',
      path: 'study/past_question_video/past_question_video.html',
      section: 'study',
      label: 'Past Questions Videos',
    },
    {
      id: 'scholarships',
      path: 'study/scholarship/list_of_scholarship.html',
      section: 'study',
      label: 'Scholarships',
    },

    // ── CBT Test ──────────────────────────────────────────────
    {
      id: 'live_arena',
      path: 'cbt_test/live_quiz_arena/all_subject.html',
      section: 'test',
      label: 'Live Arena',
    },
    {
      id: 'live_arena_instruction',
      path: 'cbt_test/live_quiz_arena/instruction.html',
      section: 'test',
      label: 'Live Arena Instruction',
      params: ['subject'],
    },
    {
      id: 'live_arena_quiz',
      path: 'cbt_test/live_quiz_arena/quiz_body.html',
      section: 'test',
      label: 'Live Quiz',
      params: ['subject', 'room'],
    },
    {
      id: 'jamb_mock',
      path: 'cbt_test/jamb_mock_exam/mock_date_and_point.html',
      section: 'test',
      label: 'JAMB Mock Exam',
    },
    {
      id: 'jamb_mock_subject',
      path: 'cbt_test/jamb_mock_exam/subject.html',
      section: 'test',
      label: 'JAMB Mock Subject',
      params: ['session'],
    },
    {
      id: 'cbt_setup',
      path: 'cbt_test/core/setup.html',
      section: 'test',
      label: 'CBT Exam Setup',
      params: ['exam_id'],
    },
    {
      id: 'cbt_instruction',
      path: 'cbt_test/core/instruction.html',
      section: 'test',
      label: 'CBT Instruction',
      params: ['exam_id', 'subject', 'year'],
    },
    {
      id: 'cbt_player',
      path: 'cbt_test/core/cbt_player.html',
      section: 'test',
      label: 'CBT Player',
      params: ['exam_id', 'subject', 'year'],
    },
    {
      id: 'cbt_result',
      path: 'cbt_test/core/result.html',
      section: 'test',
      label: 'CBT Result',
    },
    {
      id: 'cbt_analysis',
      path: 'cbt_test/core/deep_analysis.html',
      section: 'test',
      label: 'Deep Analysis',
    },
    {
      id: 'cbt_ai_plan',
      path: 'cbt_test/core/ai_plan.html',
      section: 'test',
      label: 'AI Study Plan',
    },
    {
      id: 'secondary_school',
      path: 'cbt_test/secondary_school/all_classes.html',
      section: 'test',
      label: 'Secondary School',
    },
    {
      id: 'secondary_subjects',
      path: 'cbt_test/secondary_school/subjects.html',
      section: 'test',
      label: 'Secondary School Subjects',
      params: ['class'],
    },
    {
      id: 'secondary_topic',
      path: 'cbt_test/secondary_school/topic.html',
      section: 'test',
      label: 'Secondary School Topics',
      params: ['class', 'subject'],
    },
    {
      id: 'post_utme',
      path: 'cbt_test/university_entrance_exam/all_university_exam.html',
      section: 'test',
      label: 'Post UTME CBT Exam',
    },
    {
      id: 'post_utme_subjects',
      path: 'cbt_test/university_entrance_exam/available_subjects.html',
      section: 'test',
      label: 'Post UTME Available Subjects',
      params: ['university'],
    },
    {
      id: 'university_exam',
      path: 'cbt_test/university_exam/university_exam.html',
      section: 'test',
      label: 'University CBT/Theory Exam',
    },
    {
      id: 'university_courses',
      path: 'cbt_test/university_exam/all_courses.html',
      section: 'test',
      label: 'University Courses',
      params: ['university'],
    },
    {
      id: 'leaderboard',
      path: 'leaderboard/leaderboard.html',
      section: 'test',
      label: 'Leaderboard',
    },

    // ── Blog ──────────────────────────────────────────────────
    {
      id: 'blog',
      path: 'blog/categories.html',
      section: 'blog',
      label: 'Blog',
    },

    // ── Exam Studio ───────────────────────────────────────────
    {
      id: 'tutor',
      path: 'exam_hub/tutor/teacher_entry.html',
      section: 'exam_studio',
      label: 'Tutor Entry',
      guard: 'auth',
    },
    {
      id: 'tutor_create_room',
      path: 'exam_hub/tutor/create_room.html',
      section: 'exam_studio',
      label: 'Create Room',
      guard: 'auth',
    },
    {
      id: 'tutor_leaderboard',
      path: 'exam_hub/tutor/leaderboard.html',
      section: 'exam_studio',
      label: 'Leaderboard',
      guard: 'auth',
    },
    {
      id: 'tutor_analysis',
      path: 'exam_hub/tutor/analysis.html',
      section: 'exam_studio',
      label: 'Tutor Analysis',
      guard: 'auth',
    },
    {
      id: 'student',
      path: 'exam_hub/student/all_rooms.html',
      section: 'exam_studio',
      label: 'All Rooms',
      guard: 'auth',
    },
    {
      id: 'student_instruction',
      path: 'exam_hub/student/instruction.html',
      section: 'exam_studio',
      label: 'Student Instruction',
      params: ['room'],
      guard: 'auth',
    },
    {
      id: 'student_cbt',
      path: 'exam_hub/student/cbt_board.html',
      section: 'exam_studio',
      label: 'Student CBT Board',
      params: ['room'],
      guard: 'auth',
    },
    {
      id: 'student_result',
      path: 'exam_hub/student/result.html',
      section: 'exam_studio',
      label: 'Student Result',
      params: ['room'],
      guard: 'auth',
    },
    {
      id: 'student_analysis',
      path: 'exam_hub/student/analysis.html',
      section: 'exam_studio',
      label: 'Student Analysis',
      params: ['room'],
      guard: 'auth',
    },

    // ── More ──────────────────────────────────────────────────
    {
      id: 'chat',
      path: 'chat/admin_list.html',
      section: 'more',
      label: 'Chat',
    },
    {
      id: 'chat_admin',
      path: 'chat/chat_admin.html',
      section: 'more',
      label: 'Chat Admin',
      params: ['admin'],
    },
    {
      id: 'rank',
      path: 'rank/rank.html',
      section: 'more',
      label: 'Global Rank',
    },
    {
      id: 'reward_earnings',
      path: 'earnings/earnings.html',
      section: 'more',
      label: 'Earnings',
      guard: 'auth',
    },
    {
      id: 'reward_task',
      path: 'task/task.html',
      section: 'more',
      label: 'Task',
      guard: 'auth',
    },
    {
      id: 'reward_referrals',
      path: 'referrals/referrals.html',
      section: 'more',
      label: 'Referrals',
      guard: 'auth',
    },
    {
      id: 'news_latest',
      path: 'news/latest.html',
      section: 'more',
      label: 'Latest Updates',
    },
    {
      id: 'news_admission',
      path: 'news/admission.html',
      section: 'more',
      label: 'Admission News',
    },
    {
      id: 'history',
      path: null,
      section: 'more',
      label: 'History',
      anchor: '#history',
    },
    {
      id: 'friend_score',
      path: null,
      section: 'more',
      label: 'Check Friend Score',
      anchor: '#friend_score',
    },

    // ── AI Tutor ──────────────────────────────────────────────
    {
      id: 'ai_tutor',
      path: 'AI_study_agent/ai_study_agent.html',
      section: 'ai_tutor',
      label: 'AI Tutor',
    },

    // ── Auth ──────────────────────────────────────────────────
    {
      id: 'login',
      path: 'auth/login.html',
      section: null,
      label: 'Login',
    },
  ];

  /* ═══════════════════════════════════════════════════════════════
     2. ROUTE LOOKUP MAPS  (built once at startup for O(1) access)
  ═══════════════════════════════════════════════════════════════ */
  const _byId   = Object.create(null); // id  → route
  const _byPath = Object.create(null); // normalised stem → route[]

  ROUTES.forEach(r => {
    _byId[r.id] = r;
    if (r.path) {
      const stem = r.path.split('/').pop().replace('.html', '').toLowerCase();
      if (!_byPath[stem]) _byPath[stem] = [];
      _byPath[stem].push(r);
    }
  });

  /* ═══════════════════════════════════════════════════════════════
     3. NAV GUARDS
     Functions registered here run before every navigation.
     Return false to block. If blocking, the guard must handle the
     redirect itself (e.g. send user to login).
  ═══════════════════════════════════════════════════════════════ */
  const _guards = [];

  /** Default auth guard — checks localStorage.isLoggedIn */
  function _defaultAuthGuard({ route }) {
    if (route && route.guard === 'auth') {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (!loggedIn) {
        global.location.href = _resolveBase() + 'auth/login.html';
        return false;
      }
    }
    return true;
  }

  _guards.push(_defaultAuthGuard);

  /* ═══════════════════════════════════════════════════════════════
     4. PATH RESOLVER  (depth-aware — works from any nesting level)

     Rules (checked in order):
       /public/modules/…  → base is /public/modules/
       /modules/…         → base is /modules/
       Otherwise          → /modules/ (safe fallback)
  ═══════════════════════════════════════════════════════════════ */
  function _resolveBase() {
    const path = global.location.pathname;

    const pubMatch = path.match(/^(.*\/public\/modules)\//);
    if (pubMatch) return pubMatch[1] + '/';

    const modMatch = path.match(/^(.*\/modules)\//);
    if (modMatch) return modMatch[1] + '/';

    // We are AT the modules root (index.html)
    if (path.match(/\/modules\/index\.html$/) || path.match(/\/modules\/$/)) {
      return path.replace(/index\.html$/, '').replace(/(?<!^)\/$/, '/');
    }

    return '/modules/';
  }

  /* ═══════════════════════════════════════════════════════════════
     5. ACTIVE PAGE / SECTION DETECTION  (from window.location)

     Scores every route by how many of its path segments appear in
     the current URL. The highest score wins.
  ═══════════════════════════════════════════════════════════════ */

  function _matchCurrentRoute() {
    const currentPath = global.location.pathname.toLowerCase();
    let best      = null;
    let bestScore = 0;

    ROUTES.forEach(route => {
      if (!route.path) return;
      const routeParts = route.path.toLowerCase().split('/');
      let score = 0;
      routeParts.forEach(part => {
        if (part && currentPath.includes(part)) score++;
      });
      if (score > bestScore) {
        bestScore = score;
        best = route;
      }
    });

    return bestScore >= 1 ? best : null;
  }

  /** Returns sidebar section id for the current page. */
  function getActiveSection() {
    const route = _matchCurrentRoute();
    return route ? (route.section || 'home') : 'home';
  }

  /** Returns exact route id for the current page. */
  function getActivePageId() {
    const route = _matchCurrentRoute();
    return route ? route.id : 'home';
  }

  /* ═══════════════════════════════════════════════════════════════
     6. HREF BUILDER  (replaces mecHref)

     MEC_NAV.href('cbt_setup', { exam_id: 'jamb' })
     → '/modules/cbt_test/core/setup.html?exam_id=jamb'
  ═══════════════════════════════════════════════════════════════ */
  function href(id, params) {
    const route = _byId[id];
    if (!route) {
      console.warn('[MEC_NAV] Unknown route id: "' + id + '"');
      return '#';
    }

    // Anchor-only routes (no page file)
    if (!route.path) return route.anchor || '#';

    let url = _resolveBase() + route.path;

    if (params && typeof params === 'object') {
      const qs = Object.entries(params)
        .filter(function(kv) { return kv[1] !== undefined && kv[1] !== null && kv[1] !== ''; })
        .map(function(kv) { return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]); })
        .join('&');
      if (qs) url += '?' + qs;
    }

    return url;
  }

  /* ═══════════════════════════════════════════════════════════════
     7. PROGRAMMATIC NAVIGATION  (go)

     MEC_NAV.go('cbt_setup', { exam_id: 'waec' })
     — runs guards → exit transition → navigate
  ═══════════════════════════════════════════════════════════════ */
  function go(id, params) {
    const route     = _byId[id];
    const targetUrl = href(id, params);

    for (var i = 0; i < _guards.length; i++) {
      if (_guards[i]({ id: id, route: route, href: targetUrl }) === false) return;
    }

    _triggerExitTransition(function() {
      global.location.href = targetUrl;
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     8. TRANSITION ENGINE
  ═══════════════════════════════════════════════════════════════ */

  function _triggerExitTransition(callback) {
    var main = document.querySelector('.main-content') || document.body;
    main.style.transition = 'opacity 0.18s ease-out';
    main.style.opacity    = '0';
    setTimeout(callback, 190);
  }

  function _triggerEntryTransition() {
    var main = document.querySelector('.main-content') || document.body;
    // Start invisible
    main.style.opacity    = '0';
    main.style.transition = 'none';
    // Double rAF ensures the browser has painted the opacity:0 state first
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        main.style.transition = 'opacity 0.25s ease-in';
        main.style.opacity    = '1';
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     9. BREADCRUMB API
  ═══════════════════════════════════════════════════════════════ */

  var SECTION_LABELS = {
    home:        'Home',
    study:       'Study',
    test:        'Test',
    exam_studio: 'Exam Studio',
    blog:        'Blog',
    more:        'More',
    ai_tutor:    'AI Tutor',
  };

  function breadcrumb() {
    var route = _matchCurrentRoute();
    if (!route) return [{ id: 'home', label: 'Home', href: href('home') }];

    var trail = [];
    trail.push({ id: 'home', label: 'Home', href: href('home') });

    if (route.section && route.section !== 'home') {
      trail.push({
        id:    route.section,
        label: SECTION_LABELS[route.section] || route.section,
        href:  '#',
      });
    }

    if (route.id !== 'home') {
      trail.push({ id: route.id, label: route.label, href: null });
    }

    return trail;
  }

  /* ═══════════════════════════════════════════════════════════════
     10. GLOBAL LINK INTERCEPTOR
     — Catches all internal <a> clicks
     — Runs guards, exit transition, closes mobile sidebar
  ═══════════════════════════════════════════════════════════════ */

  function _findRouteByHref(targetHref) {
    var urlPath = targetHref.split('?')[0].toLowerCase();
    var best = null;
    var bestScore = 0;
    ROUTES.forEach(function(route) {
      if (!route.path) return;
      var routeParts = route.path.toLowerCase().split('/');
      var score = 0;
      routeParts.forEach(function(part) {
        if (part && urlPath.includes(part)) score++;
      });
      if (score > bestScore) { bestScore = score; best = route; }
    });
    return bestScore >= 1 ? best : null;
  }

  function _closeMobileSidebar() {
    if (global.innerWidth <= 600 && document.body.classList.contains('sidebar-mobile-open')) {
      document.dispatchEvent(new CustomEvent('mec-close-sidebar'));
    }
  }

  function _initLinkInterceptor() {
    document.addEventListener('DOMContentLoaded', function() {
      document.body.addEventListener('click', function(e) {
        var a = e.target.closest('a[href]');
        if (!a) return;

        var rawHref = a.getAttribute('href');

        // Pass through: empty, anchor, external, new-tab
        if (!rawHref || rawHref === '#' || rawHref.startsWith('http') || a.target === '_blank') {
          return;
        }

        e.preventDefault();

        var matchedRoute = _findRouteByHref(rawHref);

        // Run guards
        for (var i = 0; i < _guards.length; i++) {
          if (_guards[i]({ id: matchedRoute ? matchedRoute.id : null, route: matchedRoute, href: rawHref }) === false) return;
        }

        _closeMobileSidebar();

        _triggerExitTransition(function() {
          global.location.href = rawHref;
        });
      });

      // Page-entry fade-in
      _triggerEntryTransition();
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     11. SIDEBAR CLOSE LISTENER
     Sidebar.js dispatches 'mec-close-sidebar' via our interceptor.
     Here we also re-expose it so sidebar.js can listen.
  ═══════════════════════════════════════════════════════════════ */
  document.addEventListener('mec-close-sidebar', function() {
    // Handled inside sidebar.js AppSidebar.toggle()
  });

  /* ═══════════════════════════════════════════════════════════════
     12. PUBLIC API
  ═══════════════════════════════════════════════════════════════ */
  var MEC_NAV = {
    /** All registered routes */
    routes: ROUTES,

    /**
     * Build a URL for a given route id.
     * @param {string} id
     * @param {object} [params]
     * @returns {string}
     */
    href: href,

    /**
     * Navigate programmatically with transition + guards.
     * @param {string} id
     * @param {object} [params]
     */
    go: go,

    /**
     * Returns active sidebar section for current URL.
     * @returns {string}
     */
    getActiveSection: getActiveSection,

    /**
     * Returns active page route id for current URL.
     * @returns {string}
     */
    getActivePageId: getActivePageId,

    /**
     * Returns the /modules/ base path for the current page.
     * @returns {string}
     */
    resolveBase: _resolveBase,

    /**
     * Returns breadcrumb trail array for the current page.
     * @returns {Array<{id:string, label:string, href:string|null}>}
     */
    breadcrumb: breadcrumb,

    /**
     * Register a custom nav guard.
     * @param {function} fn  — receives {id, route, href}, return false to block
     */
    guard: function(fn) {
      if (typeof fn === 'function') _guards.push(fn);
    },

    /**
     * Look up a route by id.
     * @param {string} id
     * @returns {object|undefined}
     */
    getRoute: function(id) {
      return _byId[id];
    },

    /**
     * Get all routes in a sidebar section.
     * @param {string} section
     * @returns {Array}
     */
    getRoutesBySection: function(section) {
      return ROUTES.filter(function(r) { return r.section === section; });
    },
  };

  /* ═══════════════════════════════════════════════════════════════
     13. BOOT
  ═══════════════════════════════════════════════════════════════ */
  _initLinkInterceptor();

  // Expose globally
  global.MEC_NAV = MEC_NAV;

  // Backwards-compat shim: keep mecHref() working for any pages that still call it
  global.mecHref = function mecHref(_base, id, params) {
    return MEC_NAV.href(id, params);
  };

  // Expose getModulesBasePath shim for any old code
  global.getModulesBasePath = function() {
    return _resolveBase();
  };

})(window);
