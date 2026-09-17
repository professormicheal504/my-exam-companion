



  
    /* Anti-flash: apply saved theme before first paint */
    (function () {
      try {
        var t = localStorage.getItem('mec_theme') || 'light';
        document.documentElement.setAttribute('data-theme', t);
      } catch (e) { }
    })();
  
  
  
  
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js">
  <script src="../../../components/supabase.js">

  <!-- MathJax for rendering LaTeX math equations -->
  
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true
      },
      startup: {
        typeset: false
      }
    };
  
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js">

  <link rel="icon"
    href="data:image/svg+xml,">
  
  
  
  
  <script src="../../../components/exam_rules.js">

  <style>
    /* ---- Theme CSS (Matched to jamb_all_subject.html) ---- */
    :root {
      --primary: #2563eb;
      --primary-dk: #1d4ed8;
      --bg-base: #f7f7f8;
      --bg-card: #ffffff;
      --border: #ebebeb;
      --text-primary: #111827;
      --text-muted: #6b7280;

      --c-answered: #2563eb;
      /* Blue â€” user selected an answer */
      --c-not-ans: #ef4444;
      /* Red  â€” visited but no answer   */
      --c-not-vis: #9ca3af;
      /* Grey â€” never opened            */
      --c-flagged: #f59e0b;
      /* Yellow â€” flagged for review    */

      /* Review mode navigator colors */
      --green: #16a34a;
      --red:   #dc2626;
    }

    /* Dark Mode Support */
    :root[data-theme="dark"] {
      --primary: #3b82f6;
      --primary-dk: #60a5fa;
      --bg-base: #0f172a;
      --bg-card: #1e293b;
      --border: #334155;
      --text-primary: #f8fafc;
      --text-muted: #94a3b8;

      --c-answered: #3b82f6;
      /* Blue  */
      --c-not-ans: #ef4444;
      /* Red   */
      --c-not-vis: #475569;
      /* Grey  */
      --c-flagged: #fbbf24;
      /* Yellow */

      /* Review mode navigator colors */
      --green: #22c55e;
      --red:   #ef4444;
    }

    :root[data-theme="dark"] .exam-header {
      background: rgba(30, 41, 59, 0.95);
    }

    :root[data-theme="dark"] .start-screen-overlay,
    :root[data-theme="dark"] .modal-overlay,
    :root[data-theme="dark"] .result-screen {
      background: rgba(15, 23, 42, 0.9);
    }

    :root[data-theme="dark"] .back-btn,
    :root[data-theme="dark"] .network-block,
    :root[data-theme="dark"] .theme-btn {
      background: var(--bg-card);
      color: var(--text-primary);
    }

    :root[data-theme="dark"] .timer-block {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.2);
    }

    :root[data-theme="dark"] .subject-tab {
      background: var(--bg-card);
    }

    :root[data-theme="dark"] .subject-tab.active {
      background: rgba(59, 130, 246, 0.1);
    }

    :root[data-theme="dark"] .option-btn {
      background: var(--bg-card);
      color: var(--text-primary);
    }

    :root[data-theme="dark"] .option-btn:hover {
      background: #334155;
      border-color: #475569;
    }

    :root[data-theme="dark"] .option-btn.selected {
      background: rgba(59, 130, 246, 0.1);
      border-color: var(--primary);
    }

    :root[data-theme="dark"] .q-cell {
      background: var(--bg-card);
      color: var(--text-primary);
    }

    /* Dark mode MUST explicitly override each coloured state â€” specificity fix */
    :root[data-theme="dark"] .q-cell.active {
      background: var(--primary) !important;
      color: #fff !important;
      border-color: var(--primary) !important;
    }

    :root[data-theme="dark"] .q-cell.ans {
      background: var(--c-answered) !important;
      color: #fff !important;
      border-color: transparent !important;
    }

    :root[data-theme="dark"] .q-cell.not-ans {
      background: var(--c-not-ans) !important;
      color: #fff !important;
      border-color: transparent !important;
    }

    :root[data-theme="dark"] .q-cell.correct {
      background: var(--green) !important;
      color: #fff !important;
      border-color: var(--green) !important;
    }

    :root[data-theme="dark"] .q-cell.wrong {
      background: var(--red) !important;
      color: #fff !important;
      border-color: var(--red) !important;
    }

    :root[data-theme="dark"] .q-cell.flag {
      background: var(--c-flagged) !important;
      color: #fff !important;
      border-color: transparent !important;
    }

    :root[data-theme="dark"] .bottom-nav,
    :root[data-theme="dark"] .nav-drawer {
      background: var(--bg-card);
      border-color: var(--border);
    }

    :root[data-theme="dark"] .ai-fab-popup,
    :root[data-theme="dark"] .ai-fab-header,
    :root[data-theme="dark"] .calc-box {
      background: var(--bg-card);
    }

    :root[data-theme="dark"] #calc-display {
      background: var(--bg-base);
      color: var(--text-primary);
    }

    :root[data-theme="dark"] .calc-btn {
      background: var(--bg-card);
      color: var(--text-primary);
    }

    :root[data-theme="dark"] .calc-btn:active {
      background: #334155;
    }

    :root[data-theme="dark"] .answer-review-box {
      background: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.2);
    }

    :root[data-theme="dark"] .arb-correct {
      color: #4ade80;
    }

    :root[data-theme="dark"] .arb-explain {
      color: var(--text-primary);
    }

    /* AI tag styling */
    .ai-generated-tag {
      display: inline-block;
      color: #8b5cf6;
      font-weight: 600;
      font-size: 12px;
      background: rgba(139, 92, 246, 0.08);
      border: 1px solid rgba(139, 92, 246, 0.2);
      padding: 3px 8px;
      border-radius: 6px;
      margin-top: 4px;
    }

    :root[data-theme="dark"] .ai-generated-tag {
      background: rgba(139, 92, 246, 0.15);
      border-color: rgba(139, 92, 246, 0.3);
    }

    /* AI generate button */
    .btn-ai-generate {
      background: #8b5cf6;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 9px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
      margin-top: 4px;
    }

    .btn-ai-generate:hover:not(:disabled) {
      background: #7c3aed;
      transform: translateY(-1px);
    }

    .btn-ai-generate:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Save-to-GitHub badge */
    .github-saved-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #10b981;
      font-weight: 600;
      margin-left: 8px;
    }

    .github-error-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #f59e0b;
      font-weight: 600;
      margin-left: 8px;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      font-family: 'Inter', sans-serif;
      scroll-behavior: smooth;
      font-size: 14px;
    }

    body {
      background: var(--bg-base);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
    }

    button {
      font-family: inherit;
      cursor: pointer;
      border: none;
      outline: none;
      background: none;
    }

    /* Common Buttons */
    .btn-primary {
      background: var(--primary);
      color: white;
      border-radius: 12px;
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 600;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-primary:hover {
      background: var(--primary-dk);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: var(--bg-card);
      color: var(--text-primary);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 600;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-secondary:hover {
      background: var(--bg-base);
      border-color: #d1d5db;
    }

    /* Modals & Overlays */
    .start-screen-overlay,
    .modal-overlay,
    .result-screen {
      position: fixed;
      inset: 0;
      z-index: 2000;
      background: rgba(247, 247, 248, 0.9);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      transition: opacity 0.3s ease;
    }

    .start-screen-overlay.hidden,
    .modal-overlay:not(.visible),
    .result-screen:not(.visible) {
      display: none;
      opacity: 0;
      pointer-events: none;
    }

    .start-box,
    .modal-box,
    .result-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 40px 32px;
      width: 100%;
      max-width: 440px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    }

    .start-title,
    .modal-title,
    .result-title {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 16px;
      letter-spacing: -0.5px;
    }

    .start-desc,
    .modal-note {
      font-size: 15px;
      color: var(--text-muted);
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
    }

    .modal-actions button {
      flex: 1;
    }

    /* â”€â”€ Question Pre-Loader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    #preloader-overlay {
      position: fixed;
      inset: 0;
      z-index: 3000;
      background: var(--bg-base);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      transition: opacity 0.5s ease, visibility 0.5s ease;
    }

    #preloader-overlay.fade-out {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
    }

    .preloader-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 48px 40px;
      width: 100%;
      max-width: 420px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
    }

    .preloader-icon {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
    }

    .preloader-headline {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.4px;
      margin-bottom: 6px;
    }

    .preloader-sub {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 36px;
      line-height: 1.5;
    }

    /* The big counter */
    .preloader-counter-wrap {
      margin: 0 auto 28px;
      position: relative;
      width: 140px;
      height: 140px;
    }

    .preloader-counter-wrap svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .preloader-ring-bg {
      fill: none;
      stroke: var(--border);
      stroke-width: 8;
    }

    .preloader-ring-fill {
      fill: none;
      stroke: url(#preloader-grad);
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 339.3;
      stroke-dashoffset: 339.3;
      transition: stroke-dashoffset 0.05s linear;
    }

    .preloader-num {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .preloader-num-val {
      font-size: 38px;
      font-weight: 800;
      line-height: 1;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }

    .preloader-num-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Progress bar below the ring */
    .preloader-bar-wrap {
      height: 6px;
      background: var(--border);
      border-radius: 99px;
      overflow: hidden;
      margin-bottom: 16px;
    }

    .preloader-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563eb, #7c3aed);
      border-radius: 99px;
      width: 0%;
      transition: width 0.05s linear;
    }

    .preloader-status {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      min-height: 20px;
    }

    /* Success state */
    .preloader-done-msg {
      margin-top: 28px;
    }

    @keyframes fadeSlideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulse-ring {

      0%,
      100% {
        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.3);
      }

      50% {
        box-shadow: 0 0 0 8px rgba(37, 99, 235, 0);
      }
    }

    :root[data-theme="dark"] #preloader-overlay {
      background: var(--bg-base);
    }

    /* Result Specifics */
    .result-score-ring {
      width: 140px;
      height: 140px;
      margin: 0 auto 24px;
      position: relative;
    }

    .result-score-text {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .result-score-num {
      font-size: 40px;
      font-weight: 800;
      line-height: 1;
    }

    .result-score-label {
      font-size: 14px;
      color: var(--text-muted);
      font-weight: 600;
    }

    .result-stats {
      display: flex;
      gap: 24px;
      justify-content: center;
      margin-bottom: 32px;
    }

    .result-stat {
      display: flex;
      flex-direction: column;
    }

    .rs-num {
      font-size: 22px;
      font-weight: 700;
    }

    .rs-label {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .result-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Layout structure */
    .exam-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: calc(100vh - 56px);
    }

    /* Mobile overrides for Topbar and Main Wrapper */
    @media (max-width: 767px) {
      app-topbar {
        display: none !important;
      }

      .mec-main {
        padding-top: 0 !important;
      }

      .exam-main {
        min-height: 100vh;
      }

      .exam-header {
        top: 0 !important;
        z-index: 1000 !important;
      }
    }



    /* Exam Header */
    .exam-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      min-height: 70px;
    }

    .header-left,
    .exam-header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .exam-subject-tag {
      font-size: 12px;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
    }

    .exam-title-text {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .network-block {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .network-block.status-good {
      color: #10b981;
    }

    .network-block.status-warn {
      color: #f59e0b;
    }

    .network-block.status-offline {
      color: #ef4444;
    }

    .timer-block {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fff0f0;
      border: 1px solid #fecaca;
      padding: 8px 16px;
      border-radius: 99px;
      color: var(--primary);
      font-weight: 700;
      font-size: 15px;
    }

    /* Main Content Area */
    .exam-layout {
      display: flex;
      flex: 1;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      padding: 32px 24px;
      gap: 32px;
    }

    .question-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .sidebar-navigator {
      width: 320px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }

    /* Subject Tabs */
    .subject-tabs-container {
      margin-bottom: 24px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .subject-tabs {
      display: flex;
      gap: 12px;
    }

    .subject-tab {
      padding: 12px 24px;
      border-radius: 99px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
      white-space: nowrap;
      transition: all 0.2s;
    }

    .subject-tab.active {
      background: rgba(37, 99, 235, 0.08);
      border-color: var(--primary);
      color: var(--primary);
    }

    /* Progress Bar */
    .progress-bar-wrap {
      height: 6px;
      background: var(--border);
      border-radius: 99px;
      margin-bottom: 24px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--primary);
      width: 0%;
      transition: width 0.3s ease;
    }

    /* Question Header */
    .q-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .q-number-badge {
      font-size: 14px;
      font-weight: 700;
      background: var(--primary);
      color: #fff;
      padding: 6px 14px;
      border-radius: 8px;
    }

    .flag-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .flag-btn.flagged {
      color: #f59e0b;
    }

    /* Question Card */
    .question-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    }

    .question-text {
      font-size: 18px;
      line-height: 1.6;
      color: var(--text-primary);
    }

    /* Options List */
    .options-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 32px;
    }

    .option-btn {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      text-align: left;
      transition: all 0.2s;
      font-size: 16px;
    }

    .option-btn:hover {
      border-color: var(--primary);
      background: var(--bg-base);
    }

    .option-btn.selected {
      border-color: var(--primary);
      background: rgba(37, 99, 235, 0.07);
    }

    .opt-letter {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--bg-base);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: var(--text-muted);
    }

    .option-btn.selected .opt-letter {
      background: var(--primary);
      color: white;
    }

    .option-btn.correct-ans {
      border-color: var(--green, #10b981);
      background: #f0fdf4;
    }

    .option-btn.correct-ans .opt-letter {
      background: var(--green, #10b981);
      color: white;
    }

    .option-btn.wrong-ans {
      border-color: var(--red, #ef4444);
      background: #fef2f2;
    }

    .option-btn.wrong-ans .opt-letter {
      background: var(--red, #ef4444);
      color: white;
    }

    /* Controls */
    .q-nav-controls {
      display: flex;
      justify-content: space-between;
      margin-top: auto;
    }

    /* Navigator Sidebar */
    .sn-header {
      margin-bottom: 20px;
    }

    .sn-title {
      font-size: 16px;
      font-weight: 700;
    }

    .nav-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .legend-dot.answered {
      background: var(--c-answered);
    }

    .legend-dot.not-answered {
      background: var(--c-not-ans);
    }

    .legend-dot.not-visited {
      background: var(--c-not-vis);
      border: 1px solid var(--border);
    }

    .legend-dot.flagged {
      background: var(--c-flagged);
    }

    .q-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 24px;
      overflow-y: auto;
      max-height: 400px;
      padding-right: 4px;
    }

    .q-cell {
      height: 40px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      color: var(--text-primary);
    }

    .q-cell.active {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
      transform: scale(1.05);
      z-index: 1;
    }

    .q-cell.ans {
      background: var(--c-answered);
      color: white;
      border-color: transparent;
    }

    .q-cell.not-ans {
      background: var(--c-not-ans);
      color: white;
      border-color: transparent;
    }

    .q-cell.correct {
      background: var(--green) !important;
      color: white !important;
      border-color: var(--green) !important;
    }

    .q-cell.wrong {
      background: var(--red) !important;
      color: white !important;
      border-color: var(--red) !important;
    }

    .q-cell.flag {
      background: var(--c-flagged) !important;
      color: white;
      border-color: transparent;
    }

    .q-cell.flag::after {
      content: '';
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      background: var(--primary);
      border-radius: 50%;
      border: 2px solid white;
    }

    /* Navigator subject tabs */
    .nav-subj-tabs {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .nav-subj-tab {
      padding: 5px 12px;
      border-radius: 99px;
      border: 1px solid var(--border);
      background: var(--bg-base);
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .nav-subj-tab.active {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
    }

    .nav-subj-panel {
      display: none;
    }

    .nav-subj-panel.active {
      display: block;
    }

    /* Legend below navigator */
    .nav-legend {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--bg-base);
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .legend-dot {
      width: 14px;
      height: 14px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    .legend-dot.answered {
      background: var(--c-answered);
    }

    .legend-dot.not-answered {
      background: var(--c-not-ans);
    }

    .legend-dot.not-visited {
      background: var(--c-not-vis);
    }

    .legend-dot.flagged {
      background: var(--c-flagged);
    }

    @media (max-width: 1024px) {
      .sidebar-navigator {
        display: none;
      }

      .exam-header {
        padding: 12px 16px;
      }

      .q-nav-controls {
        display: none;
      }
    }

    /* Review Box */
    .answer-review-box {
      display: none;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 20px;
      margin-top: 24px;
    }

    .answer-review-box.show {
      display: flex;
      gap: 16px;
    }

    .arb-icon {
      font-size: 24px;
    }

    .arb-correct {
      font-weight: 700;
      color: #166534;
      margin-bottom: 8px;
    }

    .arb-explain {
      color: #15803d;
      font-size: 14px;
      line-height: 1.5;
    }

    /* AI Fab */
    .ai-fab-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
      display: none;
    }

    .ai-fab-container.show {
      display: block;
    }

    .ai-fab-btn {
      background: var(--text-primary);
      color: white;
      border-radius: 99px;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
    }

    .ai-fab-btn.collapsed {
      padding: 12px;
    }

    .ai-fab-btn.collapsed .ai-fab-text {
      display: none;
    }

    .ai-fab-popup {
      display: none;
      position: absolute;
      bottom: calc(100% + 16px);
      right: 0;
      width: 340px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .ai-fab-container.open .ai-fab-popup {
      display: block;
      animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .ai-fab-header {
      background: var(--bg-base);
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
    }

    .ai-fab-close {
      font-size: 18px;
      color: var(--text-muted);
      cursor: pointer;
    }

    .ai-fab-content {
      padding: 20px;
      max-height: 400px;
      overflow-y: auto;
      font-size: 14px;
      line-height: 1.6;
    }

    /* Calculator */
    #calc-modal {
      display: none;
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 9000;
    }

    .calc-box {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      width: 340px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    }

    #calc-display {
      background: var(--bg-base);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      font-size: 32px;
      text-align: right;
      margin-bottom: 16px;
      color: var(--text-primary);
      min-height: 70px;
    }

    .calc-btn {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      font-weight: 700;
      font-size: 20px;
      cursor: pointer;
      transition: background 0.1s;
    }

    .calc-btn:active {
      background: var(--bg-base);
    }

    /* Drawer & Bottom Nav (Mobile) */
    .bottom-nav {
      display: none;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-card);
      border-top: 1px solid var(--border);
      z-index: 1000;
      padding: 8px 16px;
    }

    @media (max-width: 1024px) {
      .bottom-nav {
        display: flex;
        justify-content: space-between;
      }

      .exam-layout {
        padding-bottom: 80px;
      }

      .submit-btn-top {
        display: none;
      }
    }

    .bn-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 600;
      padding: 8px;
    }

    .bn-btn.active {
      color: var(--primary);
    }

    .nav-drawer-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1050;
    }

    .nav-drawer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-card);
      border-radius: 24px 24px 0 0;
      padding: 24px;
      z-index: 1100;
      transform: translateY(100%);
      transition: transform 0.3s;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }

    .nav-drawer.open {
      transform: translateY(0);
    }

    .nav-drawer-overlay.visible {
      display: block;
    }
  </style>

  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-CHG6831RHH">
  
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-CHG6831RHH');
  



  <app-topbar data-base="../../../"></app-topbar>
  <app-sidebar data-base="../../../"></app-sidebar>
  <div class="main-wrapper" id="question-container">

    <!-- QUESTION PRE-LOADER (shown while fetching questions) -->
    <div id="preloader-overlay">
      <div class="preloader-card">
        <div class="preloader-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"
            stroke-linecap="round" stroke-linejoin="round">
            
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        
        

        <!-- Circular progress ring -->
        <div class="preloader-counter-wrap">
          <svg viewBox="0 0 120 120">
            <defs>
              <linearGradient id="preloader-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#2563eb" />
                <stop offset="100%" stop-color="#7c3aed" />
              </linearGradient>
            </defs>
            <circle class="preloader-ring-bg" cx="60" cy="60" r="54" />
            <circle class="preloader-ring-fill" cx="60" cy="60" r="54" id="preloader-ring-fill" />
          </svg>
          <div class="preloader-num">
            
            
          </div>
        </div>

        <!-- Linear bar -->
        <div class="preloader-bar-wrap">
          
        </div>
        

        <!-- Action Area -->
        <div class="preloader-done-msg" id="preloader-done-msg">
          <div style="font-size:13px; color:var(--text-muted); margin-bottom:20px;" id="preloader-exam-details">
            Preparing exam resources...</div>
          <button class="btn-primary" id="btn-start-now"
            style="width:100%; padding:16px; opacity: 0.6; cursor: not-allowed;" disabled>
            Please wait until the subject load finished...
          </button>
        </div>
      </div>
    </div>

    <!-- START EXAM OVERLAY (kept for review-mode / state-restore path) -->
    <div class="start-screen-overlay hidden" id="start-screen-overlay">
      <div class="start-box">
        <h2 class="start-title">Ready to Begin?</h2>
        <p class="start-desc" id="start-desc-text">Loading exam details...</p>
      </div>
    </div>

    <!-- SUBMIT CONFIRMATION -->
    <div class="modal-overlay" id="submit-modal">
      <div class="modal-box">
        <h3 class="modal-title">Submit Exam?</h3>
        
        <p class="modal-note">You cannot change your answers after submitting.</p>
        <div class="modal-actions">
          
          
        </div>
      </div>
    </div>

    <!-- QUIT CONFIRMATION -->
    <div class="modal-overlay" id="quit-modal">
      <div class="modal-box">
        <h3 class="modal-title">Quit Exam?</h3>
        <p class="modal-note">Are you sure you want to quit? Your progress will be lost.</p>
        <div class="modal-actions">
          
          <button class="btn-primary" id="quit-confirm"
            style="background:#fef2f2; color:#ef4444; border-color:#fecaca;">Yes, Quit</button>
        </div>
      </div>
    </div>

    <!-- PASSAGE MODAL -->
    <div class="modal-overlay" id="passage-modal">
      <div class="modal-box"
        style="max-width: 800px; width: 90%; max-height: 85vh; overflow-y: auto; text-align: left; padding: 24px;">
        <div
          style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
          <h3 class="modal-title"
            style="margin:0; font-size: 20px; color: var(--primary); display: flex; align-items: center; gap: 8px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              </path>
              </path>
            </svg>
            Reference Passage
          </h3>
          <button id="passage-close"
            style="background: none; border: none; font-size: 28px; cursor: pointer; color: var(--text-muted); line-height: 1;">&times;</button>
        </div>
        
      </div>
    </div>

    <!-- RESULT SCREEN -->
    <div class="result-screen" id="result-screen">
      <div class="result-card">
        
        <h2 class="result-title" id="result-title">Exam Submitted!</h2>
        <div class="result-score-ring">
          <svg viewBox="0 0 120 120" style="width:100%;height:100%;transform:rotate(-90deg);">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#fecaca" stroke-width="10" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="#2563eb" stroke-width="10" stroke-linecap="round"
              stroke-dasharray="314" stroke-dashoffset="314" id="score-ring-circle" />
          </svg>
          <div class="result-score-text">
            
            
          </div>
        </div>
        <div class="result-stats">
          <div class="result-stat"><span
              class="rs-label">Correct</span></div>
          <div class="result-stat"><span
              class="rs-label">Wrong</span></div>
          <div class="result-stat"><span
              class="rs-label">Skipped</span></div>
        </div>
        <p id="result-message" style="margin-bottom:8px;font-weight:600;">Your exam has been saved successfully!</p>
        <p style="margin-bottom:24px;color:var(--text-muted);">You can review your answers and see corrections below.
        </p>
        <div class="result-actions">
          
          <a href="/modules/cbt_test/core/setup.html" class="btn-primary" style="text-decoration:none;">Back to
            Setup</a>
        </div>
      </div>
    </div>

    <!-- EXAM HEADER -->
    <header class="exam-header" id="exam-header">
      <div class="header-left">
        <button class="back-btn" id="btn-toggle-sidebar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg></button>
        <div>
          
          
        </div>
      </div>
      <div class="exam-header-right">
        <div class="network-block" id="network-block"><svg id="network-icon" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            
            
            
            <line x1="12" y1="20" x2="12.01" y2="20" />
          </svg></div>

        <div class="timer-block" id="timer-block">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          
        </div>
        
      </div>
    </header>

    <!-- MAIN EXAM LAYOUT -->
    <div class="exam-layout">
      <!-- QUESTION PANEL -->
      <main class="question-panel" id="question-panel">
        <div class="subject-tabs-container">
          <div class="subject-tabs" id="subject-tabs">
            <!-- Dynamically populated by JS -->
          </div>
        </div>

        <div class="progress-bar-wrap">
          
        </div>

        <div class="q-header">
          
          <button class="flag-btn" id="flag-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg> </button>
        </div>

        <div id="passage-btn-container" style="display:none; margin-bottom: 16px;">
          <button id="btn-read-passage"
            style="background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: opacity 0.2s; font-size: 14px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              </path>
              </path>
            </svg>
            Read Passage
          </button>
        </div>

        <div class="question-card" id="question-card">
          <p class="question-text" id="question-text">Loading question...</p>
          <div id="question-image-container" style="display:none; margin-top: 16px; text-align: left;">
            <img id="question-image" src="" alt="Question Image"
              style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid var(--border);" />
          </div>
        </div>
        <div class="options-list" id="options-list">
          <button class="option-btn" id="opt-0" data-opt="0"><span
              id="opt-0-text"></span></button>
          <button class="option-btn" id="opt-1" data-opt="1"><span
              id="opt-1-text"></span></button>
          <button class="option-btn" id="opt-2" data-opt="2"><span
              id="opt-2-text"></span></button>
          <button class="option-btn" id="opt-3" data-opt="3"><span
              id="opt-3-text"></span></button>
        </div>

        <div class="grid-in-container" id="grid-in-container" style="display: none; margin-bottom: 24px;">
          <input type="text" id="grid-in-input" placeholder="Type your answer here..."
            style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid var(--border); font-size: 16px; outline: none; transition: border-color 0.2s;">
        </div>

        <div id="premium-paywall" style="display: none; text-align: center; padding: 40px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; margin-bottom: 24px;">
          
          <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Premium Content</h3>
          <p style="color: var(--text-muted); margin-bottom: 24px; max-width: 400px; margin-left: auto; margin-right: auto; line-height: 1.5;">You've reached the end of the free preview. To continue practicing with the full exam, please purchase access for â‚¦500.</p>
          
        </div>

        <div class="q-nav-controls" id="q-nav-controls">
          
          
        </div>

        <div class="answer-review-box" id="answer-review-box">
          
          <div>
            
            
          </div>
        </div>
      </main>

      <!-- SIDEBAR NAVIGATOR -->
      <aside class="sidebar-navigator" id="sidebar-navigator">
        <div class="sn-header">
          <h3 class="sn-title">Question Navigator</h3>
        </div>
        <!-- Subject tabs + grids rendered by JS -->
        
        
        <!-- Legend below the grid -->
        <div class="nav-legend" style="margin-top: 4px; margin-bottom: 16px;">
          
          
          
          
        </div>
        
      </aside>
    </div>

    <!-- BOTTOM NAV (MOBILE) -->
    <nav class="bottom-nav" id="bottom-nav">
      <button class="bn-btn" id="bn-prev"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>Prev</button>
      <button class="bn-btn" id="bn-navigator"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>Nav</button>
      <button class="bn-btn" id="bn-calculator"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
          <line x1="8" y1="6" x2="16" y2="6"></line>
        </svg>Calc</button>
      <button class="bn-btn" id="bn-next"><svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>Next</button>
    </nav>

    <!-- NAV DRAWER (MOBILE) -->
    
    <div class="nav-drawer" id="nav-drawer">
      <div style="display:flex; justify-content:space-between; margin-bottom:16px; align-items:center;">
        <h4 style="font-size:18px; font-weight:700;">Question Navigator</h4>
        
      </div>
      <!-- Subject tabs + grids rendered by JS -->
      
      
      <!-- Legend below the grid -->
      <div class="nav-legend" style="margin-top: 8px; margin-bottom: 16px;">
        
        
        
        
      </div>
      
    </div>

    <!-- AI FAB -->
    <div class="ai-fab-container" id="ai-fab-container">
      <div class="ai-fab-popup" id="ai-fab-popup">
        <div class="ai-fab-header"> <span class="ai-fab-close"
            id="ai-fab-close">&times;</span></div>
        
      </div>
      <button class="ai-fab-btn collapsed" id="ai-fab-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path
            d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
        
      </button>
    </div>

    <!-- CALCULATOR -->
    <div id="calc-modal">
      <div class="calc-box">
        <div id="calc-header" style="display:flex; justify-content:space-between; margin-bottom:16px; cursor:move;">
          <h4 style="font-weight:700; font-size:16px;">Calculator</h4> <span id="calc-close"
            style="cursor:pointer; color:var(--text-muted);">&times;</span>
        </div>
        
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
           
           <button class="calc-btn" style="color:var(--primary);"
            data-val="/">&divide;</button>
            <button
            class="calc-btn" data-val="9">9</button> <button class="calc-btn" style="color:var(--primary);"
            data-val="*">&times;</button>
            <button
            class="calc-btn" data-val="6">6</button> <button class="calc-btn" style="color:var(--primary);"
            data-val="-">-</button>
            <button
            class="calc-btn" data-val="3">3</button> <button class="calc-btn" style="color:var(--primary);"
            data-val="+">+</button>
           <button class="calc-btn"
            data-val=".">.</button> <button class="calc-btn" style="background:var(--primary); color:white;"
            data-val="=">=</button>
        </div>
      </div>
    </div>
  </div>

  <script src="../../../components/nav.js">
  <script src="../../../components/topbar.js?v=4">
  <script src="../../../components/sidebar.js">


  
    /* ============================================================
       JAMB CBT BOARD Ã¢Â€Â” Exam Engine (Light Theme, No Firebase)
       Placeholder logic; wire up to your data source as needed.
    ============================================================ */

    /* â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    let EXAM_DATA = null;
    let currentQ = 0;
    let answers = {};     // { qIndex: optIndex }
    let flags = new Set();
    let visited = new Set([0]);
    let timerSec = 0;
    let timerInterval;
    let examStarted = false;
    let examFinished = false;
    let reviewMode = false;

    /* â”€â”€ DOM helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const $ = id => document.getElementById(id);

    /* â”€â”€ Pre-loader helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const RING_CIRCUMFERENCE = 2 * Math.PI * 54; // r=54 â†’ ~339.3

    function updatePreloaderCounter(current, total) {
      const countEl = $('preloader-count');
      const ringEl = $('preloader-ring-fill');
      const barEl = $('preloader-bar');
      if (!countEl) return;
      countEl.textContent = current;
      const pct = total > 0 ? current / total : 0;
      if (ringEl) ringEl.style.strokeDashoffset = (RING_CIRCUMFERENCE * (1 - pct)) + 'px';
      if (barEl) barEl.style.width = (pct * 100) + '%';
    }

    /**
     * Animates counter from `from` to `to`.
     * Speed: max ~1400 ms total, min 8 ms per step.
     */
    function animateCounter(from, to, durationMs = 900) {
      return new Promise(resolve => {
        if (from >= to) { updatePreloaderCounter(to, to); resolve(); return; }
        const steps = to - from;
        const delay = Math.max(8, Math.floor(durationMs / steps));
        let current = from;
        const tick = () => {
          current++;
          updatePreloaderCounter(current, to);
          if (current < to) setTimeout(tick, delay);
          else resolve();
        };
        setTimeout(tick, delay);
      });
    }

    function showPreloaderDone(totalQ, totalMinutes) {
      const statusEl = $('preloader-status');
      const detailsEl = $('preloader-exam-details');
      const subEl = $('preloader-sub');
      const btnEl = $('btn-start-now');
      if (statusEl) statusEl.textContent = `âœ… All ${totalQ} questions loaded and ready!`;
      if (subEl) subEl.textContent = 'Questions loaded. Read the details below and click Start when ready.';
      if (detailsEl) detailsEl.textContent = `${totalQ} Questions  â€¢  ${totalMinutes} Minutes  â€¢  Full Exam Mode`;
      if (btnEl) {
        btnEl.textContent = 'Start Exam & Begin Timer';
        btnEl.disabled = false;
        btnEl.style.opacity = '1';
        btnEl.style.cursor = 'pointer';
        btnEl.style.animation = 'pulse-ring 2s ease infinite';
      }
    }

    function hidePreloader() {
      const el = $('preloader-overlay');
      if (el) el.classList.add('fade-out');
    }

    /* â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    window.addEventListener('DOMContentLoaded', async () => {
      // Parse URL parameters
      const params = new URLSearchParams(window.location.search);
      const examId = params.get('exam_id') || 'usa/sat';
      const subjectStr = params.get('subjects') || params.get('subject') || 'sat_math';
      const year = params.get('year') || '2024';
      const dataSource = params.get('data_source');
      const uni = params.get('uni');
      const uniFile = params.get('file');

      const subjects = uni && uniFile ? ['uni_exam'] : subjectStr.split(',');

      let mappedExamPath;
      if (dataSource) {
        // e.g. "ng/exams/university_entrance/jamb/index.json" -> "ng/exams/university_entrance/jamb"
        mappedExamPath = dataSource.replace(/\/index\.json$/, '');
      } else {
        // Map old exam IDs to new paths as a fallback
        const examPathMap = {
          'usa/sat': 'us/exams/university_entrance/sat',
          'nigeria/jamb': 'ng/exams/university_entrance/jamb',
          'nigeria/waec': 'ng/exams/high_school_graduate/waec',
          'nigeria/neco': 'ng/exams/high_school_graduate/neco',
          'nigeria/post_utme': 'ng/exams/university_entrance/post_utme'
        };
        mappedExamPath = examPathMap[examId] || examId;
      }

      // Reverted to Cloudflare R2 because the files are not on GitHub yet.
      // Proxying via Cloudflare Pages _redirects to bypass CORS issues.
      const R2_BASE_URL = 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';
      const mode = params.get('mode');

      try {
        let allQuestions = [];
        let fetchedSubjectsMap = {};
        const activeCountry = localStorage.getItem('mec_country') || 'ng';

        if (mode === 'mock') {
            // â”€â”€ Mock Exam Config â€” supports JAMB (Nigeria) and SAT (USA) â”€â”€â”€â”€â”€â”€â”€â”€â”€
            // Driven by ?mock_exam=jamb|sat URL param. Defaults to jamb.
            const mockExamType = params.get('mock_exam') || 'jamb';

            const MOCK_CONFIG = {
                jamb: {
                    r2BasePath: 'ng/exams/university_entrance/jamb',
                    years: Array.from({length: 15}, (_, i) => String(2024 - i)), // 2024â†’2010
                    compulsorySubject: 'english_language',
                    compulsoryCount: 60,
                    othersCount: 40,
                    repoPrefix: 'ng/exams/university_entrance/jamb'
                },
                sat: {
                    r2BasePath: 'us/exams/university_entrance/sat',
                    years: Array.from({length: 27}, (_, i) => String(2026 - i)), // 2026â†’2000
                    compulsorySubject: null, // SAT has no compulsory â€” all equal
                    compulsoryCount: 52,    // SAT Reading/Writing standard
                    othersCount: 58         // SAT Math standard
                }
            };

            const cfg = MOCK_CONFIG[mockExamType] || MOCK_CONFIG.jamb;
            console.log(`[MOCK] Building mock exam â€” type: ${mockExamType}, path: ${cfg.r2BasePath}, subjects:`, subjects);

            const shuffleArray = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
            const optionLetters = ['A', 'B', 'C', 'D', 'E'];

            await Promise.all(subjects.map(async (subj, idx) => {
                // Determine question count for this subject
                const isCompulsory = cfg.compulsorySubject && subj.toLowerCase() === cfg.compulsorySubject;
                const isSatMath = mockExamType === 'sat' && subj.toLowerCase() === 'sat_math';
                const targetCount = isCompulsory ? cfg.compulsoryCount
                                  : isSatMath    ? cfg.othersCount
                                  : (mockExamType === 'jamb' ? cfg.othersCount : cfg.compulsoryCount); 

                const yearsToTry = shuffleArray([...cfg.years]); // random order every run
                let collected = [];

                for (const tryYear of yearsToTry) {
                    if (collected.length >= targetCount * 2) break; // collect 2x for better shuffle
                    const url = `${R2_BASE_URL}/${cfg.r2BasePath}/${subj}/objective/${tryYear}.json`;
                    const fallbackUrl = `../../../../new_staging_area/${cfg.r2BasePath}/${subj}/objective/${tryYear}.json`;
                    try {
                        let res = await fetch(url);
                        let isJson = res.headers.get('content-type')?.includes('json');
                        if (!res.ok || !isJson) {
                            console.warn(`[MOCK] Primary URL failed: ${url}. Attempting fallback: ${fallbackUrl}`);
                            res = await fetch(fallbackUrl);
                            isJson = res.headers.get('content-type')?.includes('json');
                        }
                        if (!res.ok || !isJson) {
                            console.error(`[MOCK] Both URLs failed for ${subj} ${tryYear}. Status: ${res.status}, isJson: ${isJson}`);
                            continue;
                        }
                        let data = await res.json();
                        if (!Array.isArray(data)) {
                            if (typeof data === 'object' && data !== null) {
                                data = Object.values(data);
                            } else {
                                console.error(`[MOCK] Data for ${subj} ${tryYear} is not an array or object!`);
                                continue;
                            }
                        }
                        // Include all questions, even passage-reference ones
                        const filtered = data;
                        collected.push(...filtered.map(q => ({ ...q, _year: tryYear })));
                        console.log(`[MOCK] ${subj} â€” year ${tryYear}: +${filtered.length} (pool: ${collected.length})`);
                    } catch (e) { 
                        console.error(`[MOCK] Exception during fetch for ${subj} ${tryYear}:`, e); 
                    }
                }

                if (collected.length === 0) {
                    console.warn(`[MOCK] âš ï¸ No questions found for "${subj}" in ${mockExamType} bunker`);
                    return;
                }

                // Shuffle entire pool, then slice to target â€” guarantees random mix across years
                shuffleArray(collected);
                const selected = collected.slice(0, targetCount);
                const subjectName = subj.replace(/_/g, ' ').toUpperCase();

                // â”€â”€ Normalise raw R2 format â†’ player format â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
                const normalised = selected.map((q, index) => {
                    let correctIndex = 0;
                    let optionsArray = ['Option A', 'Option B', 'Option C', 'Option D'];

                    if (q.options && q.options.length > 0 && typeof q.options[0] === 'object' && q.options[0].hasOwnProperty('is_correct')) {
                        optionsArray = q.options.map(o => o.text || '');
                        const ci = q.options.findIndex(o => o.is_correct === true);
                        if (ci !== -1) correctIndex = ci;
                    } else {
                        if (q.options && q.options.length > 0) {
                            optionsArray = q.options.map(o => o.text || o);
                        }
                        if (q.correct_option_id) {
                            const ci = optionLetters.indexOf(q.correct_option_id.toUpperCase());
                            if (ci !== -1) correctIndex = ci;
                        }
                    }

                    return {
                        id: q.question_id || index + 1,
                        subject: subjectName,
                        subjectId: subj,
                        text: q.question_text || '',
                        passage: q.reference_passage || null,
                        options: optionsArray,
                        correct: correctIndex,
                        isGridIn: q.question_type === 'Grid-In',
                        correctAnswer: q.correct_answer ? q.correct_answer.toString() : null,
                        explanation: q.explanation || (q.deep_analysis && q.deep_analysis.explanation) || 'No explanation available.',
                        exam_image: q.exam_image || q.image || q.image_url || q.question_image || null,
                        repoPath: `${cfg.repoPrefix}/${subj}/objective/${q._year}.json`
                    };
                });

                console.log(`[MOCK] âœ… ${subj}: ${normalised.length} questions ready (target ${targetCount}, pool was ${collected.length})`);
                fetchedSubjectsMap[idx] = {
                    id: subj,
                    name: subjectName,
                    rawQuestions: normalised
                };
            }));
        }

        // Fetch Exam Rules from index.json first so we can check available years
        let examConfig = { exam_id: examId, subjects: [] }; // Fallback
        if (!uni) {
            try {
                const indexUrl = `${R2_BASE_URL}/${mappedExamPath}/index.json`;
                const indexRes = await fetch(indexUrl);
                const isJson = indexRes.headers.get('content-type')?.includes('json');
                if (indexRes.ok && isJson) {
                    examConfig = await indexRes.json();
                } else {
                    throw new Error(`Status ${indexRes.status}, isJson: ${isJson}`);
                }
            } catch (e) {
                console.warn("[CBT] Could not fetch index.json for rules, using fallback.", e);
            }
        }

        if (mode !== 'mock') await Promise.all(subjects.map(async (subj, subjOriginalIndex) => {
          // â”€â”€ Build priority-ordered list of years to attempt for this subject â”€â”€
          // Strategy: selected year first, then all known years from index, 
          // then a broad fallback range so we NEVER give up on a subject just 
          // because the index lookup fails or the ID doesn't match exactly.
          let yearsToTry = [];

          if (!uni) {
            // Try exact ID match first, then case-insensitive / partial match
            let subjConfig = (examConfig.subjects || []).find(s => s.id === subj);
            if (!subjConfig) {
              // Partial match â€” handles e.g. 'history' vs 'history_government'
              subjConfig = (examConfig.subjects || []).find(s =>
                s.id && (
                  s.id.toLowerCase() === subj.toLowerCase() ||
                  s.id.toLowerCase().replace(/_/g, '').includes(subj.toLowerCase().replace(/_/g, '')) ||
                  subj.toLowerCase().replace(/_/g, '').includes(s.id.toLowerCase().replace(/_/g, ''))
                )
              );
              if (subjConfig) console.log(`[CBT] Partial ID match for "${subj}" â†’ "${subjConfig.id}"`);
            }

            if (subjConfig && subjConfig.years && subjConfig.years.length > 0) {
              const available = subjConfig.years.map(String);
              if (available.includes(String(year))) {
                // Requested year exists â€” put it first, shuffle rest as fallback
                const others = available.filter(y => y !== String(year)).sort(() => Math.random() - 0.5);
                yearsToTry = [String(year), ...others];
              } else {
                // Requested year NOT available for this subject â€” shuffle all available
                console.warn(`[CBT] Year ${year} not in index for "${subj}". Trying all available: ${available.join(', ')}`);
                yearsToTry = available.sort(() => Math.random() - 0.5);
              }
            } else {
              // Subject not in index at all â€” generate broad fallback year range
              // most recent first so we land on real data quickly
              console.warn(`[CBT] No year config found for "${subj}" in index. Generating broad year fallback.`);
              const currentYear = new Date().getFullYear();
              const broadRange = [];
              for (let y = currentYear; y >= 2000; y--) broadRange.push(String(y));
              // Put the user-selected year first if not already in range
              yearsToTry = [String(year), ...broadRange.filter(y => y !== String(year))];
            }
          } else {
            // University exam â€” only one file path, no year fallback needed
            yearsToTry = [String(year)];
          }

          let data = null;
          let fp = '';  // â† hoisted: must be accessible after the for loop exits

          // â”€â”€ Try each year in sequence until one loads successfully â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          for (const tryYear of yearsToTry) {
            if (data) break;

            let tryFp;
            if (uni && uniFile) {
              tryFp = `${activeCountry}/exams/university/${uni}/${uniFile}`;
            } else {
              tryFp = `${mappedExamPath}/${subj}/objective/${tryYear}.json`;
            }

            const localUrl = `../../../../new_staging_area/${tryFp}`;
            const r2Url = `${R2_BASE_URL}/${tryFp}`;
            const fallbackPath = tryFp.replace(new RegExp(`^${activeCountry}/`), 'ng/');
            const localFallbackUrl = `../../../../new_staging_area/${fallbackPath}`;
            const r2FallbackUrl = `${R2_BASE_URL}/${fallbackPath}`;

            // Attempt 1 & 2: Local paths
            try {
              let res = await fetch(localUrl);
              if (!res.ok && activeCountry !== 'ng') res = await fetch(localFallbackUrl);
              if (res.ok) {
                const text = await res.text();
                try { data = JSON.parse(text); fp = tryFp; console.log(`[CBT] âœ… Local (year=${tryYear}): ${localUrl}`); } catch (e) { }
              }
            } catch (e) { }

            if (data) break;

            // Attempt 3 & 4: R2 paths
            try {
              let res = await fetch(r2Url);
              const isJson = res.headers.get('content-type')?.includes('json');
              if (!res.ok || !isJson) {
                const r2FallbackUrl = `${R2_BASE_URL}/${fallbackPath}`;
                res = await fetch(r2FallbackUrl);
                const isFbJson = res.headers.get('content-type')?.includes('json');
                if (!res.ok || !isFbJson) {
                  throw new Error(`Failed to load ${subj} year ${tryYear} from all sources.`);
                }
              }
              const d = await res.json();
              data = d;
              fp = tryFp;
              console.log(`[CBT] âœ… R2 (year=${tryYear}): ${r2Url}`);
            } catch (e) { }
          }

          // â”€â”€ If ALL year attempts failed, skip this subject gracefully â”€â”€â”€â”€â”€â”€â”€â”€â”€
          if (!data) {
            console.error(`âŒ SUBJECT SKIPPED: "${subj}" â€” no data found for any of ${yearsToTry.length} years tried.`);
            return;
          }


          let rawQuestions = [];
          if (Array.isArray(data)) {
            rawQuestions = data;
          } else if (data.questions && Array.isArray(data.questions)) {
            rawQuestions = data.questions;
          } else {
            // It's the raw database format (object mapping)
            rawQuestions = Object.values(data);
            // Sort by order_id if present
            rawQuestions.sort((a, b) => (a.order_id || 0) - (b.order_id || 0));
          }

          const subjectName = subj.replace(/_/g, ' ').toUpperCase();
          // Store under original index so sort after Promise.all restores order
          fetchedSubjectsMap[subjOriginalIndex] = { id: subj, name: subjectName, rawQuestions: [] };

          rawQuestions.forEach((q, index) => {
            const optionLetters = ['A', 'B', 'C', 'D', 'E'];
            let correctIndex = 0;
            let optionsArray = ['Option A', 'Option B', 'Option C', 'Option D'];
            let isGridIn = (q.question_type === 'Grid-In');
            let correctAnswerStr = null;

            if (isGridIn) {
              correctAnswerStr = q.correct_answer ? q.correct_answer.toString() : '';
              optionsArray = [];
            }
            // Handle Raw DB Format options
            else if (q.options && q.options.length > 0 && typeof q.options[0] === 'object' && q.options[0].hasOwnProperty('is_correct')) {
              optionsArray = q.options.map(o => o.text);
              const correctOpt = q.options.findIndex(o => o.is_correct === true);
              if (correctOpt !== -1) correctIndex = correctOpt;
            }
            // Handle old format options
            else {
              if (q.options && q.options.length > 0) {
                optionsArray = q.options.map(o => o.text || o);
              }
              if (q.correct_option_id) {
                correctIndex = optionLetters.indexOf(q.correct_option_id.toUpperCase());
                if (correctIndex === -1) correctIndex = 0;
              }
            }

            // Handle reference_passage
            let passage = q.reference_passage || null;

            fetchedSubjectsMap[subjOriginalIndex].rawQuestions.push({
              id: q.question_id || index + 1,
              subject: subjectName,
              subjectId: subj,
              text: q.question_text || '',
              passage: passage,
              options: optionsArray,
              correct: correctIndex,
              isGridIn: isGridIn,
              correctAnswer: correctAnswerStr,
              explanation: q.explanation || (q.deep_analysis && q.deep_analysis.explanation) || 'No explanation available.',
              exam_image: q.exam_image || q.image || q.image_url || q.question_image || null,
              // Bug fix #14: repoPath must be the raw GitHub file path, not the CDN/local path.
              // fp is relative like "ng/exams/...", which IS the correct repo path.
              repoPath: fp
            });
          });
        }));

        // Reconstruct fetchedSubjects in original order (fixes Promise.all race condition)
        const fetchedSubjects = [];
        subjects.forEach((subj, i) => {
          if (fetchedSubjectsMap[i]) {
            fetchedSubjectsMap[i].rawQuestions.forEach(q => allQuestions.push(q));
            fetchedSubjectsMap[i].startIndex = allQuestions.length - fetchedSubjectsMap[i].rawQuestions.length;
            fetchedSubjects.push(fetchedSubjectsMap[i]);
          }
        });

        if (allQuestions.length === 0) {
          throw new Error("Could not load questions for any of the selected subjects. Please verify the year and subjects.");
        }

        // Sort fetched subjects to maintain order
        fetchedSubjects.sort((a, b) => a.startIndex - b.startIndex);

        // Rules already fetched into examConfig


        const rules = EXAM_RULES.getRules(examConfig);

        // Calculate Total Time
        let totalMinutes = 120;
        if (rules.timeCalculation === 'per_subject') {
          totalMinutes = subjects.length * (rules.timePerSubjectMinutes || 50);
        } else if (rules.timeCalculation === 'fixed') {
          totalMinutes = rules.totalTimeMinutes || 120;
        }

        // Apply Question Limits per Subject
        let finalQuestions = [];
        let runningIndex = 0;

        fetchedSubjects.forEach((subjMeta, index) => {
          // Find questions for this subject
          let subjQuestions = allQuestions.filter(q => q.subjectId === subjMeta.id);

          // Determine limit
          let limit = rules.questionLimits?.default || 50;
          if (rules.selectionType === 'jamb_style') {
            // Bug fix: use .includes() not === so 'english_language' matches keyword 'english'
            const keyword = (rules.compulsorySubjectKeyword || 'english').toLowerCase();
            const isCompulsory = subjMeta.id.toLowerCase().includes(keyword) || subjMeta.name.toLowerCase().includes(keyword);
            limit = isCompulsory ? (rules.questionLimits?.compulsory || 60) : (rules.questionLimits?.others || 40);
          }

          // Slice questions
          subjQuestions = subjQuestions.slice(0, limit);

          // Re-index for the combined array â€” do NOT touch repoPath here; it was correctly
          // set per-question inside the fetch loop above (each subject has its own fp).
          subjQuestions.forEach((q, i) => {
            q.id = runningIndex + i + 1;
          });

          finalQuestions.push(...subjQuestions);

          // Update Subject Meta
          subjMeta.startIndex = runningIndex;
          subjMeta.count = subjQuestions.length;
          runningIndex += subjQuestions.length;
        });

        // Use config display name if available, else format examId
        let examDisplayName = examConfig.display_name || examId.split('/').pop().toUpperCase().replace(/_/g, ' ');
        if (mode === 'mock') {
            const mockExamType = params.get('mock_exam') || 'jamb';
            examDisplayName = mockExamType.toUpperCase() + ' Mock';
        }
        let examTitle = `${examDisplayName} Simulator`;
        let examSubject = `${subjects.length > 1 ? 'Multiple Subjects' : subjects[0].toUpperCase().replace(/_/g, ' ')} â€¢ ${year}`;

        if (uni && uniFile) {
          const formattedUni = uni.replace(/_/g, ' ').toUpperCase();
          const fileName = uniFile.split('/').pop().replace('.json', '');
          examTitle = `${formattedUni} Past Questions`;
          examSubject = decodeURIComponent(fileName);
        }

        EXAM_DATA = {
          title: examTitle,
          subject: examSubject,
          totalMinutes: totalMinutes,
          questions: finalQuestions,
          subjectMeta: fetchedSubjects
        };

        // Build Subject Tabs dynamically
        const tabsContainer = $('subject-tabs');
        if (tabsContainer && EXAM_DATA.subjectMeta.length > 0) {
          tabsContainer.innerHTML = EXAM_DATA.subjectMeta.map((s, i) =>
            ``
          ).join('');

          // Add click listeners to tabs
          document.querySelectorAll('.subject-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
              document.querySelectorAll('.subject-tab').forEach(t => t.classList.remove('active'));
              e.target.classList.add('active');
              goTo(parseInt(e.target.dataset.start));
            });
          });
        }

      } catch (err) {
        console.error("[CBT] âŒ Failed to load exam data:", err);

        // Show error inside the preloader card
        const subEl = $('preloader-sub');
        const statusEl = $('preloader-status');
        const countEl = $('preloader-count');
        if (subEl) subEl.textContent = 'âš ï¸ Could not load exam questions';
        if (statusEl) statusEl.innerHTML = ``;
        if (countEl) countEl.textContent = '!';
        const ringEl = $('preloader-ring-fill');
        if (ringEl) { ringEl.style.stroke = '#ef4444'; }
        return;
      }

      // â”€â”€ Questions loaded â€” run the animated counter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      const totalQ = EXAM_DATA.questions.length;

      $('preloader-status').textContent = `Preparing ${totalQ} questionsâ€¦`;
      $('preloader-count-label').textContent = `of ${totalQ}`;

      // Animate counter from 0 â†’ totalQ
      await animateCounter(0, totalQ, Math.min(1400, totalQ * 12));

      // Update SEO Meta Tags
      document.title = `${EXAM_DATA.title} | My Exam Companion`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", `Practice ${EXAM_DATA.title} with our free CBT simulator.`);
      }

      timerSec = EXAM_DATA.totalMinutes * 60;

      // Check if we are launching in Review mode (or resuming review after hard refresh)
      const savedParams = localStorage.getItem('cbt_query_params');
      if (localStorage.getItem('cbt_review') === 'true' || (savedParams && savedParams === window.location.search && localStorage.getItem('cbt_exam_state'))) {
        const stateStr = localStorage.getItem('cbt_exam_state');
        if (stateStr) {
          try {
            const state = JSON.parse(stateStr);
            answers = state.answers || {};
            flags = new Set(state.flags || []);
            
            // Restore EXAM_DATA from cbt_result so questions match user's previous session
            const resultStr = localStorage.getItem('cbt_result');
            if (resultStr) {
              const resData = JSON.parse(resultStr);
              EXAM_DATA = {
                title: resData.title,
                subject: resData.subjects[0]?.name || 'General',
                totalMinutes: Math.ceil(resData.timeSpentSecs / 60) || 60,
                questions: resData.questions,
                subjectMeta: resData.subjects.map((s, i) => ({ name: s.name, startIndex: 0 }))
              };
              totalQ = EXAM_DATA.questions.length;
            }

            reviewMode = true;
            examStarted = true;
            examFinished = true;
            hidePreloader();
            $('start-screen-overlay').classList.add('hidden');
            currentQ = 0;
            renderGrids();
            renderQuestion();
            // Removed cbt_review cleanup so review state persists during hard refreshes
            return;
          } catch (e) {
            console.error("Failed to restore exam state", e);
          }
        }
      }

      // Auto-Restore active state if it matches the current exam
      if (!reviewMode) {
        const activeStateStr = localStorage.getItem('cbt_active_state');
        if (activeStateStr) {
          try {
            const activeState = JSON.parse(activeStateStr);
            const searchParams = new URLSearchParams(window.location.search);
            if (activeState.exam_id === searchParams.get('exam_id') && activeState.queryParams === window.location.search) {
              answers = activeState.answers || {};
              flags = new Set(activeState.flags || []);
              timerSec = activeState.timerSec || timerSec;
              currentQ = activeState.currentQ || 0;
              visited = new Set(activeState.visited || [currentQ]);
              $('exam-subject-tag').textContent = EXAM_DATA.subject;
              $('exam-title-text').textContent = EXAM_DATA.title;
              hidePreloader();
              $('start-screen-overlay').classList.add('hidden');
              examStarted = true;
              renderGrids();
              renderQuestion();
              startTimer();
              return;
            }
          } catch (e) {
            console.error("Failed to restore active exam state", e);
          }
        }
      }

      // Normal Start â€” reveal the Start button inside the preloader
      $('exam-subject-tag').textContent = EXAM_DATA.subject;
      $('exam-title-text').textContent = EXAM_DATA.title;
      renderGrids();
      showPreloaderDone(totalQ, EXAM_DATA.totalMinutes);
    });

    /* â”€â”€ Save State Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function saveActiveState() {
      if (reviewMode || !examStarted || examFinished) return;
      const searchParams = new URLSearchParams(window.location.search);
      const stateToSave = {
        answers: answers,
        flags: Array.from(flags),
        visited: Array.from(visited), // Bug fix: persist visited set
        timerSec: timerSec,
        currentQ: currentQ,
        exam_id: searchParams.get('exam_id'),
        queryParams: window.location.search,
        timestamp: Date.now()
      };
      localStorage.setItem('cbt_active_state', JSON.stringify(stateToSave));
    }

    /* â”€â”€ Start exam â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    $('btn-start-now').addEventListener('click', () => {
      // Dismiss the preloader overlay
      hidePreloader();
      $('start-screen-overlay').classList.add('hidden');
      examStarted = true;
      startTimer();
      renderQuestion();
    });

    /* â”€â”€ Timer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function startTimer() {
      updateTimerDisplay();
      if (timerInterval) clearInterval(timerInterval); // Bug fix #3: timer leak
      timerInterval = setInterval(() => {
        timerSec--;
        updateTimerDisplay();
        saveActiveState(); // Bug fix #3/#18: auto-save on every tick
        if (timerSec <= 0) {
          clearInterval(timerInterval);
          submitExam();
        }
      }, 1000);
    }

    function updateTimerDisplay() {
      const m = Math.floor(timerSec / 60).toString().padStart(2, '0');
      const s = (timerSec % 60).toString().padStart(2, '0');
      $('timer-display').textContent = `${m}:${s}`;
      const block = $('timer-block');
      if (timerSec < 300) {
        block.style.animation = 'pulse-red 1s infinite';
      }
    }

    /* â”€â”€ Question Text Formatting â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function formatQuestionText(text, q) {
      if (!text) return '';
      let formatted = text.replace(/\n/g, '<br>');
      
      const R2_BASE = '/r2';
      
      if (q.exam_image) {
          // Logic for images could be injected here if needed, or left in renderQuestion
      }
      return formatted;
    }

    /* â”€â”€ Render question â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function renderQuestion() {
      const q = EXAM_DATA.questions[currentQ];

      const searchParams = new URLSearchParams(window.location.search);
      const isPremium = searchParams.get('premium') === 'true';
      const currentExamId = searchParams.get('exam_id') || 'us_sat';
      const isUnlocked = localStorage.getItem('premium_unlocked_' + currentExamId) === 'true';

      if (isPremium && !isUnlocked && currentQ >= 5 && !reviewMode) {
        $('question-card').style.display = 'none';
        $('options-list').style.display = 'none';
        if ($('grid-in-container')) $('grid-in-container').style.display = 'none';
        if ($('passage-btn-container')) $('passage-btn-container').style.display = 'none';
        if ($('premium-paywall')) $('premium-paywall').style.display = 'block';
        
        $('q-number-badge').textContent = `Premium Content`;
        if (typeof updateNavControls === 'function') updateNavControls();
        
        document.querySelectorAll('.q-cell').forEach((cell, idx) => {
          cell.classList.toggle('active', idx === currentQ);
        });
        return;
      } else {
        $('question-card').style.display = 'block';
        $('options-list').style.display = '';
        if ($('premium-paywall')) $('premium-paywall').style.display = 'none';
      }

      // Update active subject tab based on currentQ
      if (EXAM_DATA.subjectMeta) {
        const activeSubj = EXAM_DATA.subjectMeta.slice().reverse().find(s => currentQ >= s.startIndex);
        if (activeSubj) {
          document.querySelectorAll('.subject-tab').forEach(tab => {
            tab.classList.toggle('active', parseInt(tab.dataset.start) === activeSubj.startIndex);
          });
        }
      }

      // Hide question content while formatting to prevent layout shift / raw LaTeX flashing
      $('question-card').style.opacity = '0';
      $('options-list').style.opacity = '0';
      if ($('grid-in-container')) $('grid-in-container').style.opacity = '0';

      $('question-card').style.transition = 'opacity 0.2s ease-in-out';
      $('options-list').style.transition = 'opacity 0.2s ease-in-out';
      if ($('grid-in-container')) $('grid-in-container').style.transition = 'opacity 0.2s ease-in-out';

      $('q-number-badge').textContent = `Q ${currentQ + 1} / ${EXAM_DATA.questions.length} - ${q.subject}`;
      const isArabic = (q.subject || '').toLowerCase().trim() === 'arabic';
      $('question-text').innerHTML = q.text;
      if (isArabic) $('question-text').setAttribute('dir', 'rtl');
      else $('question-text').removeAttribute('dir');

      let imgUrl = q.exam_image || q.image || q.image_url;
      try {
        if (imgUrl) {
          // Fix Windows backslashes
          imgUrl = imgUrl.replace(/\\/g, '/');
          const R2_BASE = 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';
          if (!imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
            imgUrl = imgUrl.startsWith('/') ? R2_BASE + imgUrl : R2_BASE + '/' + imgUrl;
          }
          console.log(`[DEBUG Image] Q${q.id} HAS IMAGE. Formatted URL:`, imgUrl);

          $('question-image-container').style.display = 'block';
          const imgEl = $('question-image');

          fetch(imgUrl, { method: 'HEAD' })
            .then(res => {
              if (!res.ok) {
                console.error(`[DEBUG Image Error] HTTP Error: ${res.status} ${res.statusText}. URL: ${imgUrl}`);
                throw new Error(`HTTP ${res.status}`);
              }
              imgEl.src = imgUrl;
            })
            .catch(err => {
              console.error(`[DEBUG Image Error] Network/CORS/HTTP error:`, err.message, imgUrl);
              imgEl.src = imgUrl;
            });

          imgEl.onerror = (e) => console.error(`[DEBUG Image Error] Browser failed to render image:`, imgUrl);
          imgEl.onload = () => console.log(`[DEBUG Image] Successfully rendered image:`, imgUrl);
        } else {
          // Log when no image is found in the question object
          console.log(`[DEBUG Image] Q${q.id} has no image property. Raw q object:`, q);
          $('question-image-container').style.display = 'none';
          $('question-image').src = '';
        }
      } catch (err) {
        console.error('[DEBUG Image Error] Exception:', err.message);
      }

      $('progress-fill').style.width = `${((currentQ + 1) / EXAM_DATA.questions.length) * 100}%`;

      /* Passage Modal Logic */
      if (q.passage) {
        $('passage-btn-container').style.display = 'block';
        $('passage-content').innerHTML = q.passage;
      } else {
        $('passage-btn-container').style.display = 'none';
        $('passage-content').innerHTML = '';
      }

      /* Options vs Grid-In */
      if (q.isGridIn) {
        $('options-list').style.display = 'none';
        $('grid-in-container').style.display = 'block';

        const gridInput = $('grid-in-input');
        gridInput.value = answers[currentQ] || '';
        gridInput.disabled = examFinished;

        if (reviewMode) {
          const userAns = (answers[currentQ] || '').toString().trim().toLowerCase().replace(/,/g, '');
          const correctAns = (q.correctAnswer || '').toString().trim().toLowerCase().replace(/,/g, '');
          if (userAns === correctAns && userAns !== '') {
            gridInput.style.borderColor = 'var(--green)';
            gridInput.style.backgroundColor = '#f0fdf4';
          } else {
            gridInput.style.borderColor = 'var(--red)';
            gridInput.style.backgroundColor = '#fef2f2';
          }
        } else {
          gridInput.style.borderColor = 'var(--border)';
          gridInput.style.backgroundColor = '#fff';
        }
      } else {
        $('options-list').style.display = 'grid'; // Re-enable grid layout for options
        $('grid-in-container').style.display = 'none';

        // Bug fix #12: render up to 5 options (A-E)
        const optLetters = ['A', 'B', 'C', 'D', 'E'];
        optLetters.forEach((letter, i) => {
          const btn = $(`opt-${i}`);
          if (!btn) return; // Skip if DOM element doesn't exist (only 4 in HTML)

          if (i < (q.options ? q.options.length : 0)) {
            btn.style.display = '';
            const span = $(`opt-${i}-text`);
            if (span) {
              span.innerHTML = q.options[i] || '';
              if (isArabic) span.setAttribute('dir', 'rtl');
              else span.removeAttribute('dir');
            }
            btn.className = 'option-btn';
            btn.querySelector('.opt-letter').textContent = letter;

            if (reviewMode) {
              if (i === q.correct) btn.classList.add('correct-ans');
              else if (answers[currentQ] === i) btn.classList.add('wrong-ans');
            } else if (answers[currentQ] === i) {
              btn.classList.add('selected');
            }
          } else {
            btn.style.display = 'none'; // Hide unused option buttons
          }
        });
      }

      /* Flag button */
      const fb = $('flag-btn');
      fb.classList.toggle('flagged', flags.has(currentQ));
      $('flag-label').textContent = flags.has(currentQ) ? 'Flagged' : 'Flag';

      /* Answer review box */
      const arb = $('answer-review-box');
      if (reviewMode) {
        arb.classList.add('show');
        const correctValStr = q.isGridIn ? q.correctAnswer : ['A', 'B', 'C', 'D'][q.correct];
        $('arb-correct-val').textContent = correctValStr;
        const explanationHtml = q.explanation || '';
        const isMissing = !explanationHtml || explanationHtml.includes('No explanation available');

        const arbExplainDiv = $('arb-explain');
        if (isArabic) arbExplainDiv.setAttribute('dir', 'rtl');
        else arbExplainDiv.removeAttribute('dir');

        // Bug #21: correctAnswer for Mistral should be the option letter (A/B/C/D), not the option text
        const optLetters = ['A', 'B', 'C', 'D', 'E'];
        const correctAnswerForAI = q.isGridIn
          ? q.correctAnswer
          : (optLetters[q.correct] ?? '');

        if (isMissing) {
          let _aiGenerating = false;

          // Eagerly check jsDelivr cache (free, instant for 1M+ users)
          const JSDELIVR_EXPLAIN_BASE = 'https://cdn.jsdelivr.net/gh/professormicheal504/my-exam-companion@main/database/ai_explanations';
          const cleanPath = (q.repoPath || '').replace(/\.json$/, '');
          const cacheUrl = `${JSDELIVR_EXPLAIN_BASE}/${cleanPath}/${q.id}.json`;

          arbExplainDiv.innerHTML = `
            <div style="margin-top: 8px;">
              <p style="color: var(--text-muted); margin-bottom: 12px;" id="ai-status-msg">Checking for explanation...</p>
            </div>
          `;

          fetch(cacheUrl)
            .then(res => res.ok ? res.json() : Promise.reject('Cache miss'))
            .then(cached => {
              if (cached && cached.explanation) {
                console.log('[CBT] âœ… AI explanation auto-loaded from jsDelivr cache!');
                q.explanation = cached.explanation;
                EXAM_DATA.questions[currentQ].explanation = cached.explanation;
                arbExplainDiv.innerHTML = cached.explanation;
                // Update FAB if open
                if ($('ai-fab-content-inject')) {
                  const fabBody = document.querySelector('.ai-exp-body');
                  if (fabBody) fabBody.innerHTML = cached.explanation;
                }
              } else {
                throw new Error('Empty cache');
              }
            })
            .catch(() => {
              // Not found in cache -> Show Generate Button
              arbExplainDiv.innerHTML = `
                <div style="margin-top: 8px;">
                  <p style="color: var(--text-muted); margin-bottom: 12px;">No explanation available for this question.</p>
                  <button class="btn-ai-generate" id="btn-ai-explain">
                    âœ¨ Generate AI Explanation
                  </button>
                  
                </div>
              `;

              const aiBtn = document.getElementById('btn-ai-explain');
              if (aiBtn) {
                aiBtn.addEventListener('click', async () => {
                  if (_aiGenerating) return;
                  _aiGenerating = true;
                  aiBtn.textContent = 'â³ Generating...';
                  aiBtn.disabled = true;

                  try {
                    // Cache already checked, go straight to Edge Function
                    aiBtn.textContent = 'âœ¨ Asking AI...';
                    const sb = MECSupabase.getSupabase();
                    const result = await sb.functions.invoke('explain-question', {
                      body: {
                        repoPath: q.repoPath,
                        questionId: q.id,
                        questionText: q.text,
                        options: q.options,
                        correctAnswer: correctAnswerForAI,
                        isGridIn: q.isGridIn
                      }
                    });

                    const data = result.data;
                    const error = result.error;

                    if (error) {
                      let errDetails = error.message;
                      if (error.context && typeof error.context.json === 'function') {
                        try {
                          const errBody = await error.context.json();
                          errDetails = errBody.error || JSON.stringify(errBody);
                        } catch (e) { }
                      }
                      console.error("AI Explanation Error Details:", errDetails);
                      throw new Error(errDetails || 'Failed to generate explanation');
                    }

                    if (data && data.explanation) {
                      EXAM_DATA.questions[currentQ].explanation = data.explanation;
                      q.explanation = data.explanation;

                      const saveStatus = document.getElementById('ai-save-status');
                      if (saveStatus) {
                        if (data.savedToGithub) {
                          console.log('[AI] âœ… Explanation saved to GitHub at:', data.savedPath);
                          saveStatus.innerHTML = '';
                        } else {
                          console.error('[AI] âŒ GitHub save failed:', data);
                          saveStatus.innerHTML = '';
                        }
                      }

                      setTimeout(() => renderQuestion(), 1500);
                    }
                  } catch (e) {
                    console.error(e);
                    aiBtn.innerHTML = 'âŒ Error. Try again.';
                    aiBtn.disabled = false;
                    _aiGenerating = false;
                  }
                });
              }
            });
        } else {
          $('arb-explain').innerHTML = explanationHtml;
        }
        // Bug #25: FAB panel always shows current (possibly just-generated) explanation
        if ($('ai-fab-content-inject')) {
          let optionsHtml = '';
          if (!q.isGridIn && q.options) {
              optionsHtml = '<div style="margin-top: 12px; font-size: 14px;">';
              q.options.forEach((opt, idx) => {
                 const isCorrect = (idx === q.correct);
                 const letter = ['A','B','C','D','E'][idx];
                 optionsHtml += ``;
              });
              optionsHtml += '</div>';
          }
          $('ai-fab-content-inject').innerHTML = `
            <div class="ai-explanation-card">
              <div class="ai-exp-header">
                
              </div>
              <div class="ai-exp-body">
                
                
                ${optionsHtml}
                <hr style="border:none; border-top: 1px solid var(--border); margin: 16px 0;">
                
                ${isMissing ? '<em style="color:var(--text-muted)">No explanation yet. Use the Generate button in the review panel.</em>' : explanationHtml}
              </div>
              <div class="ai-exp-footer">
                
                Powered by Deep Analysis
              </div>
            </div>
          `;
        }
      } else {
        arb.classList.remove('show');
      }

      /* Prev/Next buttons */
      $('qn-prev').disabled = currentQ === 0;
      if (currentQ === EXAM_DATA.questions.length - 1) {
        $('qn-next').textContent = 'Submit Exam';
        $('qn-next').style.background = '#059669';
        $('qn-next').style.borderColor = '#059669';
        if ($('bn-next')) {
          $('bn-next').innerHTML = 'Submit';
          $('bn-next').style.color = '#059669';
        }
      } else {
        $('qn-next').textContent = 'Next â†’';
        $('qn-next').style.background = '';
        $('qn-next').style.borderColor = '';
        if ($('bn-next')) {
          $('bn-next').innerHTML = 'Next';
          $('bn-next').style.color = '';
        }
      }

      /* AI Explain / Submit Button toggle */
      ['submit-btn-top', 'submit-btn-sidebar', 'submit-btn-drawer'].forEach(id => {
        const btn = $(id);
        if (btn) {
          if (examFinished) {
            btn.innerHTML = 'Deep Analysis';
            btn.style.background = 'var(--primary)';
            btn.style.borderColor = 'var(--primary)';
            btn.style.color = '#ffffff';
          } else {
            // Restore default submit appearance
            if (id === 'submit-btn-drawer') {
              btn.innerHTML = `Submit Exam
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px; height:18px; margin-left:8px;">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>`;
            } else {
              btn.innerHTML = 'Submit';
            }
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
          }
        }
      });

      updateGrids();

      // Format math formulas robustly, then reveal
      formatMath().then(() => {
        $('question-card').style.opacity = '1';
        $('options-list').style.opacity = '1';
        if ($('grid-in-container')) $('grid-in-container').style.opacity = '1';
      });
    }

    /* â”€â”€ MathJax Formatter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    let mathJaxRetries = 0;
    async function formatMath() {
      if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
        mathJaxRetries = 0;
        MathJax.typesetClear();
        try {
          await MathJax.typesetPromise();
        } catch (err) {
          console.log('MathJax error:', err);
        }
      } else {
        if (mathJaxRetries > 20) return; // Bug fix #4: prevent infinite loop
        mathJaxRetries++;
        // If MathJax isn't fully loaded yet, try again shortly
        await new Promise(resolve => setTimeout(resolve, 100));
        await formatMath();
      }
    }

    /* â”€â”€ Option click & Grid-in input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (examFinished) return;
        const opt = parseInt(btn.dataset.opt);
        answers[currentQ] = opt;
        renderQuestion();
      });
    });

    if ($('grid-in-input')) {
      $('grid-in-input').addEventListener('input', (e) => {
        if (examFinished) return;
        answers[currentQ] = e.target.value;
      });
    }

    /* â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function goTo(index) {
      if (index < 0 || index >= EXAM_DATA.questions.length) return;
      currentQ = index;
      visited.add(index);
      saveActiveState(); // Bug fix #5: save on every navigation
      syncNavTabToQuestion(index); // auto-switch subject tab in navigator
      renderQuestion();
      closeDrawer();
    }

    $('qn-prev').addEventListener('click', () => goTo(currentQ - 1));
    $('qn-next').addEventListener('click', () => {
      if (currentQ === EXAM_DATA.questions.length - 1) showSubmitModal();
      else goTo(currentQ + 1);
    });

    $('bn-prev').addEventListener('click', () => goTo(currentQ - 1));
    $('bn-next').addEventListener('click', () => {
      if (currentQ === EXAM_DATA.questions.length - 1) showSubmitModal();
      else goTo(currentQ + 1);
    });

    /* â”€â”€ Flag â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function toggleFlag() {
      if (flags.has(currentQ)) flags.delete(currentQ);
      else flags.add(currentQ);
      renderQuestion();
    }

    if ($('flag-btn')) $('flag-btn').addEventListener('click', toggleFlag);
    if ($('bn-flag')) $('bn-flag').addEventListener('click', toggleFlag);

    /* â”€â”€ Modals & Passages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if ($('passage-close')) {
      $('passage-close').addEventListener('click', () => {
        $('passage-modal').classList.remove('visible');
      });
    }
    if ($('btn-read-passage')) {
      $('btn-read-passage').addEventListener('click', () => {
        $('passage-modal').classList.add('visible');
      });
    }

    /* â”€â”€ Q Grids (Subject-Tabbed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    // Group questions by subject for navigator
    function getSubjectGroups() {
      const groups = []; // [{name, questions: [{globalIdx}]}]
      const seen = {};
      EXAM_DATA.questions.forEach((q, i) => {
        // Normalize key: trim whitespace + uppercase to prevent duplicates
        // e.g. "English Language" and "ENGLISH LANGUAGE" become the same group
        const rawSubj = q.subject || 'General';
        const key = rawSubj.trim().toUpperCase();
        if (!seen.hasOwnProperty(key)) {
          seen[key] = groups.length;
          groups.push({ name: rawSubj.trim(), questions: [] });
        }
        groups[seen[key]].questions.push({ globalIdx: i });
      });
      return groups;
    }

    function renderGrids() {
      const groups = getSubjectGroups();
      const isSingle = groups.length === 1;

      ['desktop', 'drawer'].forEach(loc => {
        const tabsEl = document.getElementById(`nav-tabs-${loc}`);
        const gridsEl = document.getElementById(`nav-grids-${loc}`);
        if (!tabsEl || !gridsEl) return;

        tabsEl.innerHTML = '';
        gridsEl.innerHTML = '';

        // Build subject tabs (hidden if only 1 subject)
        if (!isSingle) {
          const tabsRow = document.createElement('div');
          tabsRow.className = 'nav-subj-tabs';
          groups.forEach((g, gi) => {
            const tab = document.createElement('button');
            tab.className = 'nav-subj-tab' + (gi === 0 ? ' active' : '');
            tab.textContent = g.name;
            tab.addEventListener('click', () => switchNavTab(loc, gi));
            tabsRow.appendChild(tab);
          });
          tabsEl.appendChild(tabsRow);
        }

        // Build one grid panel per subject
        groups.forEach((g, gi) => {
          const panel = document.createElement('div');
          panel.className = 'nav-subj-panel' + (gi === 0 || isSingle ? ' active' : '');
          panel.id = `nav-panel-${loc}-${gi}`;

          const grid = document.createElement('div');
          grid.className = 'q-grid';
          grid.id = `q-grid-${loc}-${gi}`;

          g.questions.forEach(({ globalIdx }, posInGroup) => {
            const cell = document.createElement('div');
            cell.className = 'q-cell';
            cell.dataset.qidx = globalIdx;  // KEY FIX: store global index
            cell.textContent = posInGroup + 1; // show 1-based within subject
            cell.title = `Q${globalIdx + 1} â€” ${g.name}`;
            cell.addEventListener('click', () => goTo(globalIdx));
            grid.appendChild(cell);
          });

          panel.appendChild(grid);
          gridsEl.appendChild(panel);
        });
      });
    }

    function switchNavTab(loc, activeGi) {
      const tabsEl = document.getElementById(`nav-tabs-${loc}`);
      const gridsEl = document.getElementById(`nav-grids-${loc}`);
      if (!tabsEl || !gridsEl) return;
      tabsEl.querySelectorAll('.nav-subj-tab').forEach((t, i) => t.classList.toggle('active', i === activeGi));
      gridsEl.querySelectorAll('.nav-subj-panel').forEach((p, i) => p.classList.toggle('active', i === activeGi));
    }

    // Auto-switch navigator tab to the subject of the current question
    function syncNavTabToQuestion(qIdx) {
      const groups = getSubjectGroups();
      for (let gi = 0; gi < groups.length; gi++) {
        if (groups[gi].questions.some(q => q.globalIdx === qIdx)) {
          ['desktop', 'drawer'].forEach(loc => switchNavTab(loc, gi));
          break;
        }
      }
    }

    function updateGrids() {
      // KEY FIX: look up cells by data-qidx, not by DOM position
      document.querySelectorAll('.q-cell[data-qidx]').forEach(cell => {
        const i = parseInt(cell.dataset.qidx, 10);
        cell.className = 'q-cell';
        
        if (reviewMode) {
          const q = EXAM_DATA.questions[i];
          const userAns = (answers[i] || '').toString().trim().toLowerCase().replace(/,/g, '');
          const correctAns = (q.correctAnswer || (q.correct !== undefined ? ['A','B','C','D'][q.correct] : '')).toString().trim().toLowerCase().replace(/,/g, '');
          
          let isCorrect = false;
          if (q.isGridIn) {
             isCorrect = (userAns === correctAns && userAns !== '');
          } else {
             // For multiple choice, compare index
             isCorrect = (answers[i] === q.correct);
          }

          if (isCorrect) cell.classList.add('correct');
          else cell.classList.add('wrong');
          
          if (i === currentQ) cell.classList.add('active');
        } else {
          if (i === currentQ) cell.classList.add('active');
          if (flags.has(i)) cell.classList.add('flag');
          else if (answers[i] !== undefined) cell.classList.add('ans');
          else if (visited.has(i)) cell.classList.add('not-ans');
        }
      });
    }

    /* â”€â”€ Navigator Drawer (mobile) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    $('bn-navigator').addEventListener('click', openDrawer);
    $('nav-drawer-close').addEventListener('click', closeDrawer);
    $('nav-drawer-overlay').addEventListener('click', closeDrawer);

    function openDrawer() {
      $('nav-drawer').classList.add('open');
      $('nav-drawer-overlay').classList.add('visible');
    }

    function closeDrawer() {
      $('nav-drawer').classList.remove('open');
      $('nav-drawer-overlay').classList.remove('visible');
    }

    /* â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function showSubmitModal() {
      const answered = Object.keys(answers).length;
      const total = EXAM_DATA.questions.length;

      const subjectStats = {};
      EXAM_DATA.questions.forEach((q, i) => {
        const subj = q.subject || 'General';
        if (!subjectStats[subj]) subjectStats[subj] = { total: 0, answered: 0 };
        subjectStats[subj].total++;
        if (answers[i] !== undefined) subjectStats[subj].answered++;
      });

      let subjectHTML = '<div style="display:flex; flex-direction:column; gap:8px;">';
      for (const [subj, stats] of Object.entries(subjectStats)) {
        const unanswered = stats.total - stats.answered;
        subjectHTML += `
          <div style="display:flex; justify-content:space-between; padding:12px 16px; background: var(--bg-base); border:1px solid var(--border); border-radius:12px; font-size:14px; align-items:center;">
            
            <span style="font-family:'Inter',sans-serif; font-size: 13px;">
                 
                
                
            </span>
          </div>
        `;
      }
      subjectHTML += '</div>';

      $('modal-summary').innerHTML = `
        ${subjectHTML}
        <div style="display:flex; justify-content:space-between; margin-top:20px; padding-top:20px; border-top:1px dashed var(--border);">
          <div style="display:flex; flex-direction:column; align-items:center; flex:1; border-right:1px solid var(--border);">
            
            
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; flex:1; border-right:1px solid var(--border);">
            
            
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
            
            
          </div>
        </div>
      `;
      $('submit-modal').classList.add('visible');
    }

    function submitExam() {
      clearInterval(timerInterval);
      examFinished = true;
      $('submit-modal').classList.remove('visible');

      /* Score calculation */
      let totalCorrect = 0;
      const subjectScores = {};

      EXAM_DATA.questions.forEach((q, i) => {
        const subj = q.subject || 'General';
        if (!subjectScores[subj]) subjectScores[subj] = { correct: 0, total: 0 };
        subjectScores[subj].total++;

        let isCorrect = false;
        if (q.isGridIn) {
          const userAns = (answers[i] || '').toString().trim().toLowerCase().replace(/,/g, '');
          const correctAns = (q.correctAnswer || '').toString().trim().toLowerCase().replace(/,/g, '');
          if (userAns === correctAns && userAns !== '') {
            isCorrect = true;
          }
        } else {
          if (answers[i] === q.correct) {
            isCorrect = true;
          }
        }

        if (isCorrect) {
          subjectScores[subj].correct++;
          totalCorrect++;
        }
      });

      // Handle custom scaling per exam
      let isScaled = false;
      const titleLower = EXAM_DATA.title.toLowerCase();
      const numSubjects = Object.keys(subjectScores).length || 1;
      let calculatedTotalScore = 0;
      let calculatedMaxScore = 0;

      const subjectsArray = Object.keys(subjectScores).map(name => {
        let sc = subjectScores[name].correct;
        let mt = subjectScores[name].total;
        let finalSc = sc;
        let finalMt = mt;

        if (titleLower.includes('jamb')) {
          isScaled = true;
          finalMt = 100; // JAMB subjects are strictly out of 100
          finalSc = Math.round((sc / (mt || 1)) * finalMt);
        } else if (titleLower.includes('sat')) {
          isScaled = true;
          finalMt = Math.round(1600 / (numSubjects || 1));
          finalSc = Math.round((sc / (mt || 1)) * finalMt);
        }

        calculatedTotalScore += finalSc;
        calculatedMaxScore += finalMt;

        return { name: name, score: finalSc, total: finalMt, rawScore: sc, rawTotal: mt };
      });

      let totalScore = isScaled ? calculatedTotalScore : totalCorrect;
      let maxScore = isScaled ? calculatedMaxScore : EXAM_DATA.questions.length;

      const searchParams = new URLSearchParams(window.location.search);
      const resultData = {
        exam_id: searchParams.get('exam_id') || '',
        title: EXAM_DATA.title,
        year: new Date().getFullYear(),
        mode: 'Full Exam Mode',
        subjects: subjectsArray,
        totalScore: totalScore,
        maxScore: maxScore,
        isScaled: isScaled,
        totalQuestions: EXAM_DATA.questions.length, // Bug fix #10: was missing
        timeSpentSecs: (EXAM_DATA.totalMinutes * 60) - timerSec,
        answers: answers,
        questions: EXAM_DATA.questions,
        queryParams: window.location.search,
        regNo: 'SIM-' + new Date().getFullYear() + '-PRACTICE',
        examNo: 'CBT-' + Math.floor(Math.random() * 90000 + 10000)
      };

      // Save full exam state for Review mode (Bug fix #8: dont save massive questions array)
      const stateToSave = {
        answers: answers,
        flags: Array.from(flags)
      };

      try {
        localStorage.setItem('cbt_exam_state', JSON.stringify(stateToSave));
        localStorage.setItem('cbt_query_params', window.location.search);
        // Save to localStorage so result.html can read it
        localStorage.setItem('cbt_result', JSON.stringify(resultData));

        // Clear the active state since the exam is now submitted
        localStorage.removeItem('cbt_active_state');
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }

      // Redirect to the new JAMB Result Slip page
      window.location.href = './result.html' + window.location.search;
    }

    function openDeepAnalysis() {
      window.location.href = './deep_analysis.html';
    }

    /* Submit buttons */
    ['submit-btn-top', 'submit-btn-sidebar', 'submit-btn-drawer'].forEach(id => {
      $(id) && $(id).addEventListener('click', () => {
        if (examFinished) {
          openDeepAnalysis();
        } else {
          showSubmitModal();
        }
      });
    });

    $('modal-cancel').addEventListener('click', () => $('submit-modal').classList.remove('visible'));
    $('modal-confirm').addEventListener('click', submitExam);

    /* Review answers after result */
    $('result-review-btn').addEventListener('click', () => {
      reviewMode = true;
      $('result-screen').classList.remove('visible');
      currentQ = 0;
      renderQuestion();
    });

    /* â”€â”€ Sidebar & Quit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    if ($('btn-toggle-sidebar')) {
      $('btn-toggle-sidebar').addEventListener('click', () => {
        if (typeof mecToggleSidebar === 'function') mecToggleSidebar();
      });
    }
    if ($('quit-cancel')) {
      $('quit-cancel').addEventListener('click', () => {
        $('quit-modal').style.display = 'none';
      });
    }
    if ($('quit-confirm')) {
      $('quit-confirm').addEventListener('click', () => {
        // Bug fix #7: preserve query params when quitting to instruction page
        if (window.location.protocol === 'file:') {
          window.location.href = 'instruction.html' + window.location.search;
        } else {
          const cc = window.location.pathname.split('/').filter(p => p.length > 0)[0] || 'ng';
          window.location.href = `/${cc}/test/instruction` + window.location.search;
        }
      });
    }

    /* â”€â”€ Calculator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const calcModal = $('calc-modal');
    const openCalc = () => { if (calcModal) calcModal.style.display = 'block'; };
    if ($('bn-calculator')) $('bn-calculator').addEventListener('click', openCalc);
    if ($('calc-btn-top')) $('calc-btn-top').addEventListener('click', openCalc);
    if ($('calc-close')) {
      $('calc-close').addEventListener('click', () => {
        if (calcModal) calcModal.style.display = 'none';
      });
    }

    /* â”€â”€ Calculator Drag Logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const calcHeader = $('calc-header');
    let isDragging = false, startX, startY, initialX, initialY;

    if (calcHeader) {
      calcHeader.addEventListener('mousedown', dragStart);
      calcHeader.addEventListener('touchstart', dragStart, { passive: false });
    }

    function dragStart(e) {
      if (e.target.id === 'calc-close') return;
      isDragging = true;
      const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
      startX = clientX;
      startY = clientY;

      const rect = calcModal.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;

      document.addEventListener('mousemove', drag);
      document.addEventListener('touchmove', drag, { passive: false });
      document.addEventListener('mouseup', dragEnd);
      document.addEventListener('touchend', dragEnd);
    }

    function drag(e) {
      if (!isDragging) return;
      e.preventDefault(); // prevent scrolling while dragging on touch
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
      const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

      const dx = clientX - startX;
      const dy = clientY - startY;

      calcModal.style.left = (initialX + dx) + 'px';
      calcModal.style.top = (initialY + dy) + 'px';
      calcModal.style.right = 'auto';
      calcModal.style.bottom = 'auto';
    }

    function dragEnd() {
      isDragging = false;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('mouseup', dragEnd);
      document.removeEventListener('touchend', dragEnd);
    }

    const calcDisplay = $('calc-display');
    let calcVal = '0';
    let calcFirstOp = null;
    let calcOperator = null;
    let calcWaitNext = false;

    document.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.val;
        if (!v) return;

        if (v === 'C') {
          calcVal = '0'; calcFirstOp = null; calcOperator = null; calcWaitNext = false;
        } else if (['+', '-', '*', '/'].includes(v)) {
          if (calcOperator && !calcWaitNext) {
            const op1 = parseFloat(calcFirstOp);
            const op2 = parseFloat(calcVal);
            if (calcOperator === '+') calcVal = String(op1 + op2);
            if (calcOperator === '-') calcVal = String(op1 - op2);
            if (calcOperator === '*') calcVal = String(op1 * op2);
            if (calcOperator === '/') calcVal = op2 === 0 ? 'Error' : String(op1 / op2);
            calcOperator = null;
          }
          calcFirstOp = calcVal;
          calcOperator = v;
          calcWaitNext = true;
        } else if (v === '=') {
          if (calcOperator) {
            const op1 = parseFloat(calcFirstOp);
            const op2 = parseFloat(calcVal);
            if (calcOperator === '+') calcVal = String(op1 + op2);
            if (calcOperator === '-') calcVal = String(op1 - op2);
            if (calcOperator === '*') calcVal = String(op1 * op2);
            if (calcOperator === '/') calcVal = op2 === 0 ? 'Error' : String(op1 / op2);
            calcOperator = null;
          }
          calcWaitNext = true;
        } else if (v === 'sqrt') {
          calcVal = String(Math.sqrt(parseFloat(calcVal)));
          calcWaitNext = true;
        } else if (v === '%') {
          calcVal = String(parseFloat(calcVal) / 100);
          calcWaitNext = true;
        } else {
          if (calcWaitNext) {
            calcVal = v;
            calcWaitNext = false;
          } else {
            calcVal = calcVal === '0' ? v : calcVal + v;
          }
        }

        if (calcDisplay) {
          let d = parseFloat(calcVal);
          if (!isNaN(d) && d.toString().length > 10) d = parseFloat(d.toFixed(8));
          calcDisplay.textContent = (calcVal.endsWith('.') || calcVal === 'Error') ? calcVal : d;
        }
      });
    });

    /* Ã¢Â”Â€Ã¢Â”Â€ Network status Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€ */
    function updateNetwork() {
      const block = $('network-block');
      if (navigator.onLine) {
        block.classList.remove('status-offline', 'status-warn');
        block.classList.add('status-good');
      } else {
        block.classList.remove('status-good', 'status-warn');
        block.classList.add('status-offline');
      }
    }
    updateNetwork();
    window.addEventListener('online', updateNetwork);
    window.addEventListener('offline', updateNetwork);

    /* Ã¢Â”Â€Ã¢Â”Â€ Keyboard shortcuts Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€ */
    document.addEventListener('keydown', e => {
      if (examFinished || !examStarted) return;
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C', 'D'].includes(key)) {
        const idx = ['A', 'B', 'C', 'D'].indexOf(key);
        if (idx < EXAM_DATA.questions[currentQ].options.length) {
          answers[currentQ] = idx;
          renderQuestion();
        }
      } else if (key === 'N') { goTo(currentQ + 1); }
      else if (key === 'P') { goTo(currentQ - 1); }
      else if (key === 'S') { showSubmitModal(); }
      else if (key === 'Y' && $('submit-modal').classList.contains('visible')) { submitExam(); }
      else if (key === 'R' && $('submit-modal').classList.contains('visible')) {
        $('submit-modal').classList.remove('visible');
      }
    });

    /* Ã¢Â”Â€Ã¢Â”Â€ AI FAB Logic Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€ */
    let aiFabTimeout;
    window.addEventListener('DOMContentLoaded', () => {
      // Small timeout to ensure state is restored if coming from result page
      setTimeout(() => {
        if (reviewMode) {
          $('ai-fab-container').classList.add('show');

          // Collapse button after 5 seconds
          aiFabTimeout = setTimeout(() => {
            $('ai-fab-btn').classList.add('collapsed');
          }, 5000);
        }
      }, 100);
    });

    $('ai-fab-btn').addEventListener('click', () => {
      const container = $('ai-fab-container');
      const btn = $('ai-fab-btn');

      if (!container.classList.contains('open')) {
        container.classList.add('open');
        // Un-collapse when opened so it's ready when closed again
        btn.classList.remove('collapsed');
        clearTimeout(aiFabTimeout);
      }
    });

    $('ai-fab-close').addEventListener('click', () => {
      $('ai-fab-container').classList.remove('open');
      // Re-collapse after closing
      aiFabTimeout = setTimeout(() => {
        $('ai-fab-btn').classList.add('collapsed');
      }, 5000);
    });

    /* Ã¢Â”Â€Ã¢Â”Â€ Passage Modal Events Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€Ã¢Â”Â€ */
    $('btn-read-passage').addEventListener('click', () => {
      $('passage-modal').classList.add('visible');
    });

    $('passage-close').addEventListener('click', () => {
      $('passage-modal').classList.remove('visible');
    });

    // Also close if clicking outside modal box
    $('passage-modal').addEventListener('click', (e) => {
      if (e.target === $('passage-modal')) {
        $('passage-modal').classList.remove('visible');
      }
    });
    /* â”€â”€â”€ Network Status Indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function updateNetworkStatus() {
      const icon = $('network-icon');
      if (!icon) return;

      if (!navigator.onLine) {
        icon.style.color = '#ef4444'; // Red (Offline)
      } else {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        // If API is supported and connection is slow
        if (conn && ['slow-2g', '2g', '3g'].includes(conn.effectiveType)) {
          icon.style.color = '#f59e0b'; // Yellow (Poor)
        } else {
          icon.style.color = '#10b981'; // Green (Stable)
        }
      }
    }

    updateNetworkStatus();
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) conn.addEventListener('change', updateNetworkStatus);

    /* â”€â”€ Premium Purchase Redirect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function purchasePremium() {
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      const searchParams = new URLSearchParams(window.location.search);
      const examId = searchParams.get('exam_id') || 'nigeria/uniben_post_utme';
      
      window.location.href = `../../top_up/amount_entry.html?redirect_back=${redirectUrl}&auto_amount=500&purpose=exam_unlock&exam_id=${encodeURIComponent(examId)}`;
    }

  



