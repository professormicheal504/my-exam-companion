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
      url: (cc) => `/${cc}`,
      section: 'home',
      label: 'Home',
    },

    // ── Study ─────────────────────────────────────────────────
    {
      id: 'classroom',
      path: 'study/classroom/classroom_subject.html',
      url: (cc) => `/${cc}/study/classroom`,
      section: 'study',
      label: 'Enter Classroom',
    },
    {
      id: 'classroom_explanation',
      path: 'study/classroom/classroom_explanation.html',
      url: (cc) => `/${cc}/study/classroom`,
      section: 'study',
      label: 'Classroom Explanation',
      params: ['subject', 'topic'],
    },
    {
      id: 'classroom_questions',
      path: 'study/classroom/classroom_questions.html',
      url: (cc) => `/${cc}/study/classroom`,
      section: 'study',
      label: 'Classroom Questions',
      params: ['subject', 'topic'],
    },
    {
      id: 'study_pq',
      path: 'study/study_past_questions/study_subject.html',
      url: (cc) => `/${cc}/study/past-questions`,
      section: 'study',
      label: 'Study Past Questions',
    },
    {
      id: 'study_past_questions',
      path: 'study/study_past_questions/study_past_questions.html',
      url: (cc) => `/${cc}/study/past-questions`,
      section: 'study',
      label: 'Study Past Questions Player',
      params: ['subject', 'year'],
    },
    {
      id: 'study_explanation',
      path: 'study/study_past_questions/study_explanation.html',
      url: (cc) => `/${cc}/study/past-questions`,
      section: 'study',
      label: 'Study Explanation',
      params: ['subject', 'year', 'q'],
    },
    {
      id: 'novel',
      path: 'study/novel/novel.html',
      url: (cc) => `/${cc}/study/novel`,
      section: 'study',
      label: 'Novel',
    },
    {
      id: 'syllabus',
      path: 'study/syllabus/syllabus.html',
      url: (cc) => `/${cc}/study/syllabus`,
      section: 'study',
      label: 'JAMB Syllabus',
    },
    {
      id: 'brochure',
      path: 'study/brochure/brochure.html',
      url: (cc) => `/${cc}/study/brochure`,
      section: 'study',
      label: 'Brochure',
    },
    {
      id: 'topic_video',
      path: 'study/topic_video/topic_video.html',
      url: (cc) => `/${cc}/study/videos`,
      section: 'study',
      label: 'Topic Video Lessons',
    },
    {
      id: 'past_q_video',
      path: 'study/past_question_video/past_question_video.html',
      url: (cc) => `/${cc}/study/videos`,
      section: 'study',
      label: 'Past Questions Videos',
    },
    {
      id: 'scholarships',
      path: 'study/scholarship/list_of_scholarship.html',
      url: (cc) => `/${cc}/study/scholarships`,
      section: 'study',
      label: 'Scholarships',
    },

    // ── CBT Test ──────────────────────────────────────────────
    {
      id: 'live_arena',
      path: 'cbt_test/live_quiz_arena/exam_body.html',
      url: (cc) => `/${cc}/test/live-arena`,
      section: 'test',
      label: 'Live Arena',
    },
    {
      id: 'live_arena_instruction',
      path: 'cbt_test/live_quiz_arena/instruction.html',
      url: (cc) => `/${cc}/test/live-arena/instruction`,
      section: 'test',
      label: 'Live Arena Instruction',
      params: ['subject'],
    },
    {
      id: 'live_arena_quiz',
      path: 'cbt_test/live_quiz_arena/quiz_body.html',
      url: (cc) => `/${cc}/test/live-arena`,
      section: 'test',
      label: 'Live Quiz',
      params: ['subject', 'room'],
    },
    {
      id: 'jamb_mock',
      path: 'cbt_test/jamb_mock_exam/mock_date_and_point.html',
      url: (cc) => `/${cc}/test/jamb-mock`,
      section: 'test',
      label: 'JAMB Mock Exam',
    },
    {
      id: 'jamb_mock_subject',
      path: 'cbt_test/jamb_mock_exam/subject.html',
      url: (cc) => `/${cc}/test/jamb-mock`,
      section: 'test',
      label: 'JAMB Mock Subject',
      params: ['session'],
    },
    {
      id: 'cbt_setup',
      path: 'cbt_test/core/setup.html',
      url: (cc) => `/${cc}/test`,
      section: 'test',
      label: 'CBT Exam Setup',
      params: ['exam_id'],
    },
    {
      id: 'cbt_instruction',
      path: 'cbt_test/core/instruction.html',
      url: (cc) => `/${cc}/test/instruction`,
      section: 'test',
      label: 'CBT Instruction',
      params: ['exam_id', 'subject', 'year'],
    },
    {
      id: 'cbt_player',
      path: 'cbt_test/core/cbt_player.html',
      url: (cc) => `/${cc}/test`,
      section: 'test',
      label: 'CBT Player',
      params: ['exam_id', 'subject', 'year'],
    },
    {
      id: 'cbt_result',
      path: 'cbt_test/core/result.html',
      url: (cc) => `/${cc}/test/result`,
      section: 'test',
      label: 'CBT Result',
    },
    {
      id: 'cbt_analysis',
      path: 'cbt_test/core/deep_analysis.html',
      url: (cc) => `/${cc}/test/analysis`,
      section: 'test',
      label: 'Deep Analysis',
    },
    {
      id: 'cbt_ai_plan',
      path: 'cbt_test/core/ai_plan.html',
      url: (cc) => `/${cc}/ai-tutor`,
      section: 'test',
      label: 'AI Study Plan',
    },
    {
      id: 'secondary_school',
      path: 'cbt_test/secondary_school/all_classes.html',
      url: (cc) => `/${cc}/test/secondary`,
      section: 'test',
      label: 'Secondary School',
    },
    {
      id: 'secondary_subjects',
      path: 'cbt_test/secondary_school/subjects.html',
      url: (cc) => `/${cc}/test/secondary`,
      section: 'test',
      label: 'Secondary School Subjects',
      params: ['class'],
    },
    {
      id: 'secondary_topic',
      path: 'cbt_test/secondary_school/topic.html',
      url: (cc) => `/${cc}/test/secondary`,
      section: 'test',
      label: 'Secondary School Topics',
      params: ['class', 'subject'],
    },
    {
      id: 'post_utme',
      path: 'cbt_test/core/university_exam_post_utme.html',
      url: (cc) => `/${cc}/test/post-utme`,
      section: 'test',
      label: 'Post UTME',
    },
    {
      id: 'post_utme_subjects',
      path: 'cbt_test/university_entrance_exam/available_subjects.html',
      url: (cc) => `/${cc}/test/post-utme`,
      section: 'test',
      label: 'Post UTME Available Subjects',
      params: ['university'],
    },
    {
      id: 'university_exam',
      path: 'cbt_test/university_exam/university_exam.html',
      url: (cc) => `/${cc}/test/university`,
      section: 'test',
      label: 'University CBT/Theory Exam',
    },
    {
      id: 'university_courses',
      path: 'cbt_test/university_exam/all_courses.html',
      url: (cc) => `/${cc}/test/university`,
      section: 'test',
      label: 'University Courses',
      params: ['university'],
    },
    {
      id: 'leaderboard',
      path: 'leaderboard/leaderboard.html',
      url: (cc) => `/${cc}/rank`,
      section: 'test',
      label: 'Leaderboard',
    },
    {
      id: 'history',
      path: 'history/history.html',
      url: (cc) => `/${cc}/history`,
      section: 'test',
      label: 'History',
    },

    // ── Blog ──────────────────────────────────────────────────
    {
      id: 'blog',
      path: 'blog/categories.html',
      url: (cc) => `/${cc}/blog`,
      section: 'blog',
      label: 'Blog',
    },

    // ── Exam Studio ───────────────────────────────────────────
    {
      id: 'tutor',
      path: 'exam_hub/tutor/List_of_rooms.html',
      url: (cc) => `/${cc}/studio/tutor`,
      section: 'exam_studio',
      label: 'Tutor',
      guard: 'auth',
    },
    {
      id: 'tutor_create_room',
      path: 'exam_hub/tutor/create_room.html',
      url: (cc) => `/${cc}/studio/tutor/create_room`,
      section: 'exam_studio',
      label: 'Create Room',
      guard: 'auth',
    },
    {
      id: 'tutor_leaderboard',
      path: 'exam_hub/tutor/leaderboard.html',
      url: (cc) => `/${cc}/studio/tutor/leaderboard`,
      section: 'exam_studio',
      label: 'Leaderboard',
      guard: 'auth',
    },
    {
      id: 'tutor_analysis',
      path: 'exam_hub/tutor/analysis.html',
      url: (cc) => `/${cc}/studio/tutor/analysis`,
      section: 'exam_studio',
      label: 'Tutor Analysis',
      guard: 'auth',
    },
    {
      id: 'tutor_create_exam',
      path: 'exam_hub/tutor/create_exam.html',
      url: (cc) => `/${cc}/studio/tutor/create_exam`,
      section: 'exam_studio',
      label: 'Create Exam',
      guard: 'auth',
    },
    {
      id: 'tutor_hub_manager',
      path: 'exam_hub/tutor/hub_manager.html',
      url: (cc) => `/${cc}/studio/tutor/hub_manager`,
      section: 'exam_studio',
      label: 'Hub Manager',
      guard: 'auth',
    },
    {
      id: 'tutor_question_editor',
      path: 'exam_hub/tutor/question_editor.html',
      url: (cc) => `/${cc}/studio/tutor/question_editor`,
      section: 'exam_studio',
      label: 'Question Editor',
      guard: 'auth',
    },
    {
      id: 'tutor_chat_room',
      path: 'exam_hub/tutor/chat_room.html',
      url: (cc) => `/${cc}/studio/tutor/chat_room`,
      section: 'exam_studio',
      label: 'Tutor Chat Room',
      guard: 'auth',
    },
    {
      id: 'student',
      path: 'exam_hub/student/home.html',
      url: (cc) => `/${cc}/studio/student`,
      section: 'exam_studio',
      label: 'Student',
      guard: 'auth',
    },
    {
      id: 'student_instruction',
      path: 'exam_hub/student/instruction.html',
      url: (cc) => `/${cc}/studio/student/instruction`,
      section: 'exam_studio',
      label: 'Student Instruction',
      params: ['room'],
      guard: 'auth',
    },
    {
      id: 'student_cbt',
      path: 'exam_hub/student/cbt_board.html',
      url: (cc) => `/${cc}/studio/student/cbt_board`,
      section: 'exam_studio',
      label: 'Student CBT Board',
      params: ['room'],
      guard: 'auth',
    },
    {
      id: 'student_result',
      path: 'exam_hub/student/result.html',
      url: (cc) => `/${cc}/studio/student/result`,
      section: 'exam_studio',
      label: 'Student Result',
      params: ['room'],
      guard: 'auth',
    },
    {
      id: 'student_analysis',
      path: 'exam_hub/student/analysis.html',
      url: (cc) => `/${cc}/studio/student/analysis`,
      section: 'exam_studio',
      label: 'Student Analysis',
      params: ['room'],
      guard: 'auth',
    },
    {
      id: 'student_all_course',
      path: 'exam_hub/student/all_course.html',
      url: (cc) => `/${cc}/studio/student/all_course`,
      section: 'exam_studio',
      label: 'Student All Courses',
      guard: 'auth',
    },
    {
      id: 'student_chat_with_admin',
      path: 'exam_hub/student/chat_with_admin.html',
      url: (cc) => `/${cc}/studio/student/chat_with_admin`,
      section: 'exam_studio',
      label: 'Chat With Admin',
      guard: 'auth',
    },

    // ── More ──────────────────────────────────────────────────
    {
      id: 'chat',
      path: 'chat/admin_list.html',
      url: (cc) => `/${cc}/chat`,
      section: 'more',
      label: 'Chat',
    },
    {
      id: 'chat_admin',
      path: 'chat/chat_admin.html',
      url: (cc) => `/${cc}/chat`,
      section: 'more',
      label: 'Chat Admin',
      params: ['admin'],
    },
    {
      id: 'rank',
      path: 'rank/rank.html',
      url: (cc) => `/${cc}/rank`,
      section: 'more',
      label: 'Global Rank',
    },
    {
      id: 'reward_earnings',
      path: 'earnings/earnings.html',
      url: (cc) => `/${cc}/earnings`,
      section: 'more',
      label: 'Earnings',
      guard: 'auth',
    },
    {
      id: 'reward_task',
      path: 'task/task.html',
      url: (cc) => `/${cc}/task`,
      section: 'more',
      label: 'Task',
      guard: 'auth',
    },
    {
      id: 'reward_referrals',
      path: 'referrals/referrals.html',
      url: (cc) => `/${cc}/referral`,
      section: 'more',
      label: 'Referrals',
      guard: 'auth',
    },
    {
      id: 'news_latest',
      path: 'news/latest.html',
      url: (cc) => `/${cc}/news`,
      section: 'more',
      label: 'Latest Updates',
    },
    {
      id: 'news_admission',
      path: 'news/admission.html',
      url: (cc) => `/${cc}/news/admission`,
      section: 'more',
      label: 'Admission News',
    },

    {
      id: 'friend_score',
      path: null,
      section: 'more',
      label: 'Check Friend Score',
      anchor: '#friend_score',
    },

    // ── Pricing ──────────────────────────────────────────────────────
    {
      id: 'pricing',
      path: 'pricing/pricing.html',
      url: (cc) => `/${cc}/pricing`,
      section: 'more',
      label: 'Pricing',
    },

    // ── Top-Up / Wallet ────────────────────────────────────────────────
    {
      id: 'top_up',
      path: 'top_up/wallet_dashboard.html',
      url: '/top-up',
      section: 'more',
      label: 'Top Up Wallet',
    },
    {
      id: 'top_up_amount',
      path: 'top_up/amount_entry.html',
      url: '/top-up/add',
      section: 'more',
      label: 'Top-Up Amount Entry',
    },
    {
      id: 'top_up_checkout',
      path: 'top_up/paystack_inline_checkout.html',
      url: '/top-up/checkout',
      section: 'more',
      label: 'Top-Up Checkout',
    },

    // ── AI Tutor ──────────────────────────────────────────────
    {
      id: 'ai_tutor',
      path: 'cbt_test/core/ai_plan.html',
      url: (cc) => `/${cc}/ai-tutor`,
      section: 'ai_tutor',
      label: 'AI Tutor',
    },

    // ── Auth ──────────────────────────────────────────────────
    {
      id: 'login',
      path: 'auth/login.html',
      url: '/login',
      section: null,
      label: 'Login',
    },
    {
      id: 'signup',
      path: 'auth/sign_up.html',
      url: '/signup',
      section: null,
      label: 'Sign Up',
    },
    {
      id: 'verify',
      path: 'auth/otp.html',
      url: '/verify',
      section: null,
      label: 'OTP Verify',
    },
    {
      id: 'onboarding',
      path: 'auth/fill_form.html',
      url: '/onboarding',
      section: null,
      label: 'Profile Setup',
    }
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

  /** Default auth guard — checks Supabase token or localStorage.isLoggedIn */
  function _defaultAuthGuard({ route, href: targetHref }) {
    if (route && route.guard === 'auth') {
      const legacyLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const supabaseToken = localStorage.getItem('sb-alwplfsqzrijxqujrpyu-auth-token');
      const loggedIn = legacyLoggedIn || (supabaseToken !== null);
      if (!loggedIn) {
        // Use absolute path so it works on clean URLs like /wallet-dashboard.
        // Pass the intended destination as ?redirect= so login can send them back.
        const redirect = encodeURIComponent(targetHref || global.location.href);
        global.location.href = '/login?redirect=' + redirect;
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
     4.5 COUNTRY DETECTION
  ═══════════════════════════════════════════════════════════════ */
  function getCountry() {
    // 1. From URL slug (highest priority)
    var pathParts = global.location.pathname.split('/');
    var slug = pathParts[1] ? pathParts[1].toLowerCase() : '';
    if (['ng', 'gh', 'us'].includes(slug)) {
      localStorage.setItem('mec_country', slug);
      return slug;
    }

    // 2. From localStorage (returning user)
    var stored = localStorage.getItem('mec_country');
    if (stored && ['ng', 'gh', 'us'].includes(stored)) return stored;

    // 3. From browser language
    var lang = navigator.language || '';
    if (lang.includes('GH')) return 'gh';
    if (lang.includes('US')) return 'us';

    // 4. Default
    return 'ng';
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
  function href(id, params, overrideCc) {
    const route = _byId[id];
    if (!route) {
      console.warn('[MEC_NAV] Unknown route id: "' + id + '"');
      return '#';
    }

    if (!route.path) return route.anchor || '#';

    const cc = overrideCc || getCountry();
    let url;
    
    if (typeof route.url === 'function') {
      url = route.url(cc);
    } else if (typeof route.url === 'string') {
      url = route.url;
    } else {
      url = _resolveBase() + route.path;
    }

    const mergedParams = Object.assign({}, route.defaultParams || {}, params || {});

    if (mergedParams && Object.keys(mergedParams).length > 0) {
      const qs = Object.entries(mergedParams)
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
     * Get the detected country code (ng, gh, us)
     * @returns {string}
     */
    getCountry: getCountry,

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
     12.5 SEO / AEO ENGINE
  ═══════════════════════════════════════════════════════════════ */
  function _applySEO(route) {
    if (!route) return;
    var cc = getCountry();
    var countryNames = { ng: 'Nigeria', gh: 'Ghana', us: 'USA' };
    var countryName = countryNames[cc] || 'Nigeria';

    var title = route.label + " - My Exam Companion (" + countryName + ")";
    var desc = "Access " + route.label + " for " + countryName + " on My Exam Companion. Free CBT practice, past questions, scholarships and exam news.";

    if (route.seo) {
      if (typeof route.seo.title === 'function') title = route.seo.title(cc);
      else if (route.seo.title) title = route.seo.title;
      if (typeof route.seo.description === 'function') desc = route.seo.description(cc);
      else if (route.seo.description) desc = route.seo.description;
    }

    document.title = title;

    function setMeta(name, content, isProperty) {
      var attr = isProperty ? 'property' : 'name';
      var el = document.querySelector('meta[' + attr + '="' + name + '"]');
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    }
    setMeta('description', desc);
    setMeta('og:type', 'website', true);
    setMeta('og:title', title, true);
    setMeta('og:description', desc, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);

    var canonicalUrl = global.location.origin + href(route.id);
    var canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) { canonicalLink = document.createElement('link'); canonicalLink.rel = 'canonical'; document.head.appendChild(canonicalLink); }
    canonicalLink.href = canonicalUrl;
    setMeta('og:url', canonicalUrl, true);

    var isGlobal = route.path && (route.path.includes('auth/') || route.path.includes('top_up/'));
    if (!isGlobal) {
      ['ng', 'gh', 'us'].forEach(function(langCc) {
        var hr = document.querySelector('link[hreflang="en-' + langCc.toUpperCase() + '"]');
        if (!hr) { hr = document.createElement('link'); hr.rel = 'alternate'; hr.setAttribute('hreflang', 'en-' + langCc.toUpperCase()); document.head.appendChild(hr); }
        hr.href = global.location.origin + href(route.id, null, langCc);
      });
      var hrDef = document.querySelector('link[hreflang="x-default"]');
      if (!hrDef) { hrDef = document.createElement('link'); hrDef.rel = 'alternate'; hrDef.setAttribute('hreflang', 'x-default'); document.head.appendChild(hrDef); }
      hrDef.href = global.location.origin + '/';
    }

    var ld = document.querySelector('script[type="application/ld+json"]');
    if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; document.head.appendChild(ld); }
    var schema = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": desc,
      "url": canonicalUrl
    };
    if (route.section === 'study' || route.section === 'test') {
      schema["@type"] = "LearningResource";
      schema["educationalLevel"] = "High School";
    } else if (route.section === 'home') {
      schema["@type"] = ["WebSite", "SearchAction"];
      schema["potentialAction"] = { "@type": "SearchAction", "target": global.location.origin + "/search?q={search_term_string}", "query-input": "required name=search_term_string" };
    } else if (route.id === 'pricing') {
      schema["@type"] = ["Product", "Offer"];
      schema["priceCurrency"] = "NGN";
    } else if (route.section === 'blog') {
      schema["@type"] = "CollectionPage";
    }
    ld.textContent = JSON.stringify(schema);
  }

  /* ═══════════════════════════════════════════════════════════════
     13. BOOT
  ═══════════════════════════════════════════════════════════════ */
  // 1. Run guards immediately for the current page on direct load
  var currentRoute = _matchCurrentRoute();
  if (currentRoute) {
    _applySEO(currentRoute);
    for (var i = 0; i < _guards.length; i++) {
      if (_guards[i]({ id: currentRoute.id, route: currentRoute, href: global.location.href }) === false) return;
    }
  }

  // 2. Initialize link interceptor for subsequent clicks
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
