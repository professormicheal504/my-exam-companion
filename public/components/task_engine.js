/**
 * MEC Task Engine v2.0 — Advanced Automation Algorithm
 * ======================================================
 * Tracks real user activity (CBT scores, article reads, classroom Q answers)
 * via localStorage events. Automatically queues the next task as soon as
 * the current one finishes, firing a rich completion popup.
 *
 * USAGE (any page):
 *   <script src="path/to/task_engine.js"></script>
 *   Then call:
 *     MECTasks.recordCBTScore(subjectName, pct)     — after CBT result
 *     MECTasks.recordArticleRead(articleId, title)   — after reading article
 *     MECTasks.recordClassroomAnswer(correct, total) — after each answer
 *
 * The engine fires a floating toast + optional full-screen popup.
 */

(function(window) {
  'use strict';

  /* ============================================================
     CONSTANTS
  ============================================================ */
  const STORAGE_KEY   = 'mec_task_engine_v2';
  const SPINS_KEY     = 'mec_spin_tickets';

  /* ---- Task Template Catalogue ---- */
  /* type:
      'cbt_score'       – score ≥ target% on any subject
      'article_read'    – read N articles (subject optional)
      'classroom_qa'    – answer N classroom questions correctly
  */
  const TASK_CATALOGUE = [
    /* -- CBT Tasks -- */
    {
      id: 'cbt_any_60',
      type: 'cbt_score',
      icon: '📝',
      title: 'Score 60% on Any Subject',
      desc: 'Attempt any CBT exam and score at least 60%.',
      target: 60,
      subject: null,
      tickets: 1,
      xp: 50
    },
    {
      id: 'cbt_any_75',
      type: 'cbt_score',
      icon: '🔥',
      title: 'Score 75% on Any Subject',
      desc: 'Push harder! Achieve 75% or above on any exam.',
      target: 75,
      subject: null,
      tickets: 2,
      xp: 80
    },
    {
      id: 'cbt_jamb_80',
      type: 'cbt_score',
      icon: '🏅',
      title: 'Score 80% in a JAMB Subject',
      desc: 'Ace any JAMB subject with at least 80% score.',
      target: 80,
      subject: 'jamb',
      tickets: 2,
      xp: 100
    },
    {
      id: 'cbt_waec_70',
      type: 'cbt_score',
      icon: '📚',
      title: 'Score 70% in a WAEC Subject',
      desc: 'Prove your WAEC knowledge with a 70%+ score.',
      target: 70,
      subject: 'waec',
      tickets: 2,
      xp: 90
    },
    {
      id: 'cbt_any_90',
      type: 'cbt_score',
      icon: '🌟',
      title: 'Score 90% on Any Subject',
      desc: 'Elite mode: can you get 90% or above?',
      target: 90,
      subject: null,
      tickets: 3,
      xp: 150
    },
    /* -- Article Tasks -- */
    {
      id: 'article_read_2',
      type: 'article_read',
      icon: '📰',
      title: 'Read 2 Subject Articles',
      desc: 'Open and read any 2 articles to completion.',
      target: 2,
      subject: null,
      tickets: 1,
      xp: 30
    },
    {
      id: 'article_read_5',
      type: 'article_read',
      icon: '📖',
      title: 'Read 5 Subject Articles',
      desc: 'Knowledge is power! Read 5 full articles.',
      target: 5,
      subject: null,
      tickets: 2,
      xp: 60
    },
    {
      id: 'article_read_10',
      type: 'article_read',
      icon: '🎓',
      title: 'Article Marathon: Read 10',
      desc: 'True scholar! Read 10 articles in any subject.',
      target: 10,
      subject: null,
      tickets: 3,
      xp: 100
    },
    /* -- Classroom Q&A Tasks -- */
    {
      id: 'classroom_qa_20',
      type: 'classroom_qa',
      icon: '💡',
      title: 'Answer 20 Classroom Questions',
      desc: 'Engage with the classroom and answer 20 questions.',
      target: 20,
      correct: false,
      tickets: 1,
      xp: 40
    },
    {
      id: 'classroom_qa_50',
      type: 'classroom_qa',
      icon: '🧠',
      title: 'Answer 50 Classroom Questions',
      desc: 'Answer 50 classroom questions — any subject.',
      target: 50,
      correct: false,
      tickets: 2,
      xp: 80
    },
    {
      id: 'classroom_correct_10',
      type: 'classroom_qa',
      icon: '✅',
      title: 'Get 10 Correct in Classroom',
      desc: 'Answer 10 questions correctly in classroom mode.',
      target: 10,
      correct: true,
      tickets: 2,
      xp: 70
    },
    {
      id: 'classroom_correct_25',
      type: 'classroom_qa',
      icon: '🏆',
      title: 'Get 25 Correct in Classroom',
      desc: 'Answer 25 questions correctly to earn big rewards.',
      target: 25,
      correct: true,
      tickets: 3,
      xp: 120
    },
  ];

  /* ============================================================
     STATE MANAGEMENT
  ============================================================ */
  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || buildDefaultState();
    } catch (e) {
      return buildDefaultState();
    }
  }

  function buildDefaultState() {
    return {
      activeTasks: [],     // IDs of currently active tasks (max 3 shown)
      completed: {},       // { taskId: timestamp }
      progress: {},        // { taskId: currentCount }
      articleLog: [],      // [{ id, title, ts }]
      cbtLog: [],          // [{ subject, pct, ts }]
      classroomLog: { total: 0, correct: 0, sessionTotal: 0, sessionCorrect: 0 },
      queuedToday: [],     // IDs queued today for rotation
      lastQueueDate: null,
    };
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
  }

  function getSpins() {
    return parseInt(localStorage.getItem(SPINS_KEY) || '0', 10);
  }

  function addSpins(n) {
    const cur = getSpins();
    localStorage.setItem(SPINS_KEY, String(cur + n));
    // Broadcast to task.html if open in same tab
    window.dispatchEvent(new CustomEvent('mec_spins_update', { detail: { spins: cur + n } }));
  }

  /* ============================================================
     TASK QUEUE ALGORITHM
     – Never repeats a task until all catalogue tasks have run
     – Prioritises incomplete types (mix of CBT / article / QA)
     – Max 3 active tasks at a time
  ============================================================ */
  function getEligibleTasks(state) {
    const today = new Date().toDateString();
    if (state.lastQueueDate !== today) {
      state.queuedToday = [];
      state.lastQueueDate = today;
    }

    const completedIds = Object.keys(state.completed);
    const activeIds    = state.activeTasks;

    return TASK_CATALOGUE.filter(t =>
      !activeIds.includes(t.id) &&
      !completedIds.includes(t.id)
    );
  }

  function ensureActiveTasks(state) {
    const MAX_ACTIVE = 3;
    const eligible = getEligibleTasks(state);

    while (state.activeTasks.length < MAX_ACTIVE && eligible.length > 0) {
      // Smart rotation: prefer filling different types
      const activeTypes = state.activeTasks.map(id => {
        const t = TASK_CATALOGUE.find(x => x.id === id);
        return t ? t.type : null;
      });

      // Pick a task whose type is least represented
      const typeCount = {};
      for (const t of eligible) {
        typeCount[t.type] = (typeCount[t.type] || 0) + 1;
      }
      const leastType = Object.keys(typeCount).sort((a, b) => {
        const aActive = activeTypes.filter(x => x === a).length;
        const bActive = activeTypes.filter(x => x === b).length;
        return aActive - bActive;
      })[0];

      const pick = eligible.find(t => t.type === leastType) || eligible[0];
      if (!pick) break;

      state.activeTasks.push(pick.id);
      if (!state.progress[pick.id]) state.progress[pick.id] = 0;
      eligible.splice(eligible.indexOf(pick), 1);
    }

    // If all tasks completed, reset completions (new cycle)
    if (state.activeTasks.length === 0 && eligible.length === 0) {
      const nonActive = Object.keys(state.completed).filter(id => !state.activeTasks.includes(id));
      if (nonActive.length > 0) {
        nonActive.forEach(id => delete state.completed[id]);
        ensureActiveTasks(state);
      }
    }

    saveState(state);
  }

  /* ============================================================
     COMPLETION LOGIC
  ============================================================ */
  function checkTaskCompletion(state, taskId) {
    const task = TASK_CATALOGUE.find(t => t.id === taskId);
    if (!task) return;

    const progress = state.progress[taskId] || 0;
    if (progress >= task.target && !state.completed[taskId]) {
      // Mark complete
      state.completed[taskId] = Date.now();
      state.activeTasks = state.activeTasks.filter(id => id !== taskId);

      // Award spins & XP
      addSpins(task.tickets);

      // Queue next task automatically
      ensureActiveTasks(state);
      saveState(state);

      // Fire celebration popup
      showCompletionPopup(task, state);
    }
  }

  /* ============================================================
     RECORD ACTIVITY — Public API
  ============================================================ */
  /**
   * Called when user completes a CBT exam.
   * @param {string} subjectName   e.g. 'Mathematics', 'JAMB', 'WAEC'
   * @param {number} percentage    0-100
   */
  function recordCBTScore(subjectName, percentage) {
    const state = loadState();
    ensureActiveTasks(state);

    state.cbtLog.push({ subject: (subjectName || '').toLowerCase(), pct: percentage, ts: Date.now() });
    saveState(state);

    for (const taskId of [...state.activeTasks]) {
      const task = TASK_CATALOGUE.find(t => t.id === taskId);
      if (!task || task.type !== 'cbt_score') continue;

      // Check subject match (null = any)
      const subjMatch = !task.subject ||
        (subjectName || '').toLowerCase().includes(task.subject.toLowerCase());
      if (!subjMatch) continue;

      // Score must meet target
      if (percentage >= task.target) {
        state.progress[taskId] = (state.progress[taskId] || 0) + 1;
        // cbt_score tasks need 1 qualifying attempt
        if (state.progress[taskId] < 1) state.progress[taskId] = 1;
        // Force set to target so it triggers
        if (state.progress[taskId] < task.target) state.progress[taskId] = task.target;
        saveState(state);
        checkTaskCompletion(state, taskId);
      }
    }

    // Show progress toast
    showProgressToast(`CBT Score: ${Math.round(percentage)}%`, percentage >= 60
      ? 'Great score! Task progress updated.' : 'Keep going! Try to hit 60%+.');
  }

  /**
   * Called when the user opens/reads an article (call when article content is visible).
   * @param {string} articleId   Unique article ID
   * @param {string} title       Article title
   */
  function recordArticleRead(articleId, title) {
    const state = loadState();
    ensureActiveTasks(state);

    // Deduplicate — don't count same article twice today
    const today = new Date().toDateString();
    const alreadyRead = state.articleLog.some(a =>
      a.id === String(articleId) && new Date(a.ts).toDateString() === today
    );
    if (alreadyRead) return;

    state.articleLog.push({ id: String(articleId), title: title || 'Article', ts: Date.now() });
    saveState(state);

    for (const taskId of [...state.activeTasks]) {
      const task = TASK_CATALOGUE.find(t => t.id === taskId);
      if (!task || task.type !== 'article_read') continue;

      // Count articles read today for this task's window
      const todayReads = state.articleLog.filter(a =>
        new Date(a.ts).toDateString() === today
      ).length;

      state.progress[taskId] = todayReads;
      saveState(state);
      checkTaskCompletion(state, taskId);
    }

    showProgressToast('Article Read ✓', `"${(title || 'Article').slice(0, 30)}" counted toward your reading task.`);
  }

  /**
   * Called every time user answers a classroom question.
   * @param {boolean} isCorrect
   * @param {number}  totalAnsweredInSession  running count this session
   */
  function recordClassroomAnswer(isCorrect, totalAnsweredInSession) {
    const state = loadState();
    ensureActiveTasks(state);

    state.classroomLog.total   = (state.classroomLog.total   || 0) + 1;
    state.classroomLog.correct = (state.classroomLog.correct || 0) + (isCorrect ? 1 : 0);

    // Reset session counters on new day
    const today = new Date().toDateString();
    if (state.classroomLog.sessionDate !== today) {
      state.classroomLog.sessionDate    = today;
      state.classroomLog.sessionTotal   = 0;
      state.classroomLog.sessionCorrect = 0;
    }
    state.classroomLog.sessionTotal   += 1;
    state.classroomLog.sessionCorrect += isCorrect ? 1 : 0;
    saveState(state);

    for (const taskId of [...state.activeTasks]) {
      const task = TASK_CATALOGUE.find(t => t.id === taskId);
      if (!task || task.type !== 'classroom_qa') continue;

      if (task.correct) {
        state.progress[taskId] = state.classroomLog.sessionCorrect;
      } else {
        state.progress[taskId] = state.classroomLog.sessionTotal;
      }
      saveState(state);
      checkTaskCompletion(state, taskId);
    }
  }

  /* ============================================================
     UI — COMPLETION POPUP
  ============================================================ */
  function ensurePopupStyles() {
    if (document.getElementById('mec-task-popup-styles')) return;
    const style = document.createElement('style');
    style.id = 'mec-task-popup-styles';
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

      #mec-task-overlay {
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.3s ease;
        pointer-events: none; font-family: 'Inter', sans-serif;
      }
      #mec-task-overlay.show { opacity: 1; pointer-events: auto; }

      #mec-task-popup {
        background: #1e293b; border-radius: 28px; padding: 40px 36px;
        max-width: 440px; width: 92%; text-align: center;
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.15);
        transform: scale(0.85) translateY(30px);
        transition: transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
      }
      #mec-task-overlay.show #mec-task-popup { transform: scale(1) translateY(0); }

      .mtc-burst { font-size: 64px; margin-bottom: 12px; display: block;
        animation: mtc-bounce 0.8s cubic-bezier(0.28,0.84,0.42,1) forwards; }
      @keyframes mtc-bounce {
        0%   { transform: scale(0); opacity: 0; }
        60%  { transform: scale(1.2); }
        80%  { transform: scale(0.95); }
        100% { transform: scale(1); opacity: 1; }
      }

      .mtc-title { font-size: 22px; font-weight: 800; color: #f8fafc; margin-bottom: 4px; }
      .mtc-task-name {
        font-size: 15px; font-weight: 700; color: #60a5fa;
        background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.2);
        border-radius: 10px; padding: 8px 14px; margin: 12px auto;
        display: inline-block; max-width: 100%;
      }
      .mtc-desc { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }

      .mtc-rewards {
        display: flex; gap: 12px; justify-content: center; margin-bottom: 24px; flex-wrap: wrap;
      }
      .mtc-reward-pill {
        display: flex; align-items: center; gap: 6px;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 99px; padding: 8px 16px; font-size: 14px; font-weight: 700; color: #f8fafc;
      }
      .mtc-reward-pill.gold { border-color: rgba(245,158,11,0.4); background: rgba(245,158,11,0.1); color: #fbbf24; }
      .mtc-reward-pill.green { border-color: rgba(16,185,129,0.4); background: rgba(16,185,129,0.1); color: #34d399; }

      .mtc-next-label { font-size: 11px; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.1em; color: #64748b; margin-bottom: 10px; }
      .mtc-next-task {
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 14px; padding: 14px 18px; margin-bottom: 20px; text-align: left;
        display: flex; align-items: center; gap: 12px;
      }
      .mtc-next-icon { font-size: 28px; flex-shrink: 0; }
      .mtc-next-text { flex: 1; }
      .mtc-next-name { font-size: 14px; font-weight: 700; color: #e2e8f0; }
      .mtc-next-desc { font-size: 12px; color: #64748b; margin-top: 2px; }

      .mtc-btn {
        width: 100%; background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #fff; font-size: 15px; font-weight: 800; padding: 16px;
        border-radius: 14px; border: none; cursor: pointer;
        transition: transform 0.15s, box-shadow 0.15s;
        box-shadow: 0 4px 20px rgba(37,99,235,0.35);
      }
      .mtc-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.45); }
      .mtc-btn:active { transform: translateY(0); }

      /* Progress Bar */
      .mtc-prog-wrap { height: 6px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden; margin-top: 8px; }
      .mtc-prog-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 99px;
        transition: width 1s ease; }

      /* Toast */
      #mec-task-toast {
        position: fixed; bottom: 80px; right: 20px; z-index: 99998;
        background: #1e293b; border: 1px solid rgba(255,255,255,0.08);
        border-radius: 14px; padding: 12px 18px; max-width: 320px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        display: flex; align-items: flex-start; gap: 10px;
        transform: translateX(110%); transition: transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275);
        font-family: 'Inter', sans-serif;
      }
      #mec-task-toast.show { transform: translateX(0); }
      .mtt-icon { font-size: 24px; flex-shrink: 0; margin-top: 2px; }
      .mtt-title { font-size: 13px; font-weight: 700; color: #e2e8f0; margin-bottom: 2px; }
      .mtt-desc  { font-size: 12px; color: #64748b; line-height: 1.4; }
    `;
    document.head.appendChild(style);
  }

  let _popupQueue = [];
  let _popupShowing = false;

  function showCompletionPopup(task, state) {
    _popupQueue.push({ task, state });
    if (!_popupShowing) processPopupQueue();
  }

  function processPopupQueue() {
    if (_popupQueue.length === 0) { _popupShowing = false; return; }
    _popupShowing = true;
    const { task, state } = _popupQueue.shift();
    _renderPopup(task, state);
  }

  function _renderPopup(task, state) {
    ensurePopupStyles();

    // Next queued tasks
    const nextTasks = state.activeTasks
      .map(id => TASK_CATALOGUE.find(t => t.id === id))
      .filter(Boolean)
      .slice(0, 2);

    let overlay = document.getElementById('mec-task-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mec-task-overlay';
      document.body.appendChild(overlay);
    }

    const nextTaskHtml = nextTasks.length > 0 ? `
      <div class="mtc-next-label">&#9654; Next Task Queued</div>
      ${nextTasks.map(nt => `
        <div class="mtc-next-task">
          <div class="mtc-next-icon">${nt.icon}</div>
          <div class="mtc-next-text">
            <div class="mtc-next-name">${nt.title}</div>
            <div class="mtc-next-desc">${nt.desc}</div>
          </div>
        </div>
      `).join('')}
    ` : '';

    overlay.innerHTML = `
      <div id="mec-task-popup" role="dialog" aria-modal="true">
        <span class="mtc-burst">🎉</span>
        <div class="mtc-title">Task Completed!</div>
        <div class="mtc-task-name">${task.icon} ${task.title}</div>
        <p class="mtc-desc">Amazing work! Your progress has been saved and your rewards are credited.</p>

        <div class="mtc-rewards">
          <div class="mtc-reward-pill gold">🎟️ +${task.tickets} Spin Ticket${task.tickets > 1 ? 's' : ''}</div>
          <div class="mtc-reward-pill green">⭐ +${task.xp} XP</div>
        </div>

        ${nextTaskHtml}

        <button class="mtc-btn" id="mec-task-close-btn" onclick="window.MECTasks._closePopup()">
          &#9654; Awesome! Let's Go
        </button>
      </div>
    `;

    // Trigger show animation
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });

    // Broadcast update to task page if it's open
    window.dispatchEvent(new CustomEvent('mec_task_completed', { detail: { taskId: task.id, state } }));
  }

  window.MECTasks = window.MECTasks || {};
  window.MECTasks._closePopup = function() {
    const overlay = document.getElementById('mec-task-overlay');
    if (overlay) {
      overlay.classList.remove('show');
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        processPopupQueue(); // show next in queue if any
      }, 300);
    } else {
      processPopupQueue();
    }
  };

  /* ============================================================
     TOAST
  ============================================================ */
  let _toastTimer = null;
  function showProgressToast(title, desc) {
    ensurePopupStyles();
    let toast = document.getElementById('mec-task-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'mec-task-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <div class="mtt-icon">⚡</div>
      <div>
        <div class="mtt-title">${title}</div>
        <div class="mtt-desc">${desc}</div>
      </div>
    `;

    clearTimeout(_toastTimer);
    requestAnimationFrame(() => toast.classList.add('show'));
    _toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
  }

  /* ============================================================
     LIVE TASK STATE — for task.html
  ============================================================ */
  function getTasksForDisplay() {
    const state = loadState();
    ensureActiveTasks(state);
    return state.activeTasks.map(id => {
      const task = TASK_CATALOGUE.find(t => t.id === id);
      const progress = state.progress[id] || 0;
      const pct = Math.min(100, Math.round((progress / task.target) * 100));
      return { ...task, progress, pct };
    });
  }

  function getAllCompletedToday() {
    const state = loadState();
    const today = new Date().toDateString();
    return Object.entries(state.completed)
      .filter(([id, ts]) => new Date(ts).toDateString() === today)
      .map(([id]) => TASK_CATALOGUE.find(t => t.id === id))
      .filter(Boolean);
  }

  /* ============================================================
     EXPOSE PUBLIC API
  ============================================================ */
  window.MECTasks = Object.assign(window.MECTasks || {}, {
    recordCBTScore,
    recordArticleRead,
    recordClassroomAnswer,
    getTasksForDisplay,
    getAllCompletedToday,
    getSpins,
    showProgressToast,
    _catalogue: TASK_CATALOGUE,
    _loadState: loadState,
    _ensureActive: ensureActiveTasks
  });

  // Auto-init: make sure tasks are seeded on load
  (function() {
    const state = loadState();
    ensureActiveTasks(state);
  })();

})(window);
