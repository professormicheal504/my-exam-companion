import json
import codecs

html_content = r'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rank & Rewards | My Exam Companion</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../components/topbar.css">
  <link rel="stylesheet" href="../../components/sidebar.css?v=2">
  <style>
    /* ===========================
       RESET & BASE
    =========================== */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 14px; font-family: 'Inter', sans-serif; scroll-behavior: smooth; }
    body { background: #f7f7f8; color: #131212; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
    a { text-decoration: none; color: inherit; }
    button { font-family: inherit; cursor: pointer; border: none; outline: none; background: none; }
    img { display: block; max-width: 100%; }

    /* ===========================
       APP SHELL
    =========================== */
    .app { display: flex; min-height: 100vh; overflow-x: hidden; }
    .main-wrapper {
      margin-left: 90px;
      flex: 1; display: flex; flex-direction: column; min-height: 100vh;
      min-width: 0; max-width: calc(100% - 90px); transition: margin-left 0.2s; overflow-x: hidden;
    }

    /* ===========================
       TOPBAR
    =========================== */
    .topbar {
      height: 56px; background: #fff; border-bottom: 1px solid #f0f0f0;
      display: flex; align-items: center; padding: 0 16px; position: sticky; top: 0; z-index: 40; gap: 12px;
    }
    .topbar__logo { display: flex; align-items: center; flex-shrink: 0; }
    .topbar__logo img { height: 40px; width: auto; object-fit: contain; }
    .topbar__search {
      flex: 1; display: flex; align-items: center; gap: 8px; max-width: 400px;
      background: #f5f5f5; border: 1px solid #ebebeb; border-radius: 9999px; padding: 7px 14px;
      transition: border-color 0.15s;
    }
    .topbar__search:focus-within { border-color: #2563eb; background: #fff; }
    .topbar__search svg { color: #9ca3af; flex-shrink: 0; }
    .topbar__search input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: #131212; font-family: inherit; min-width: 0; }
    .topbar__search input::placeholder { color: #b0b0b0; }
    .topbar__actions { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }
    .btn-login  { padding: 7px 16px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: #131212; border: 1px solid #ddd; background: #fff; transition: background 0.15s; white-space: nowrap; }
    .btn-login:hover { background: #f5f5f5; }
    .btn-register { padding: 7px 16px; border-radius: 9999px; font-size: 12px; font-weight: 600; color: #fff; background: #131212; border: 1px solid #131212; transition: background 0.15s; white-space: nowrap; }
    .btn-register:hover { background: #2d2d2d; }

    /* ===========================
       CONTENT AREA
    =========================== */
    .content-area { display: flex; flex: 1; overflow-x: hidden; background: #fff; }
    .main-content { flex: 1; min-width: 0; width: 100%; overflow-x: hidden; padding-bottom: 40px; }
    .page-container { max-width: 800px; margin: 0 auto; padding: 40px 32px; }

    /* ===========================
       PROMO BANNER
    =========================== */
    .promo-banner {
      background: linear-gradient(135deg, #f59e0b 0%, #2563eb 100%);
      border-radius: 20px;
      padding: 32px;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 30px rgba(183, 12, 1, 0.2);
      margin-bottom: 40px;
      position: relative;
      overflow: hidden;
    }
    .promo-banner::before {
      content: '';
      position: absolute;
      top: -50%; left: -50%; width: 200%; height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 50%);
      animation: rotate 20s linear infinite;
    }
    @keyframes rotate { 100% { transform: rotate(360deg); } }
    
    .promo-content { position: relative; z-index: 1; }
    .promo-title { font-size: 32px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.02em; }
    .promo-desc { font-size: 16px; font-weight: 500; opacity: 0.9; max-width: 400px; line-height: 1.5; }
    .promo-icon {
      font-size: 80px; position: relative; z-index: 1;
      filter: drop-shadow(0 10px 20px rgba(0,0,0,0.2));
      animation: float 3s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    /* ===========================
       CURRENT STATUS
    =========================== */
    .status-card {
      background: #fff; border: 1px solid #f0f0f0; border-radius: 20px;
      padding: 32px; text-align: center; margin-bottom: 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .status-icon { font-size: 64px; margin-bottom: 16px; }
    .status-level { font-size: 14px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    .status-title { font-size: 28px; font-weight: 800; color: #111827; margin-bottom: 12px; }
    .status-desc { font-size: 15px; color: #6b7280; font-weight: 500; }

    /* ===========================
       LEVEL PROGRESSION (15 Levels)
    =========================== */
    .journey-title {
      font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 24px; text-align: center;
    }
    
    .timeline {
      position: relative;
      max-width: 400px;
      margin: 0 auto;
      padding-bottom: 40px;
    }
    
    /* The main connecting line */
    .timeline::before {
      content: ''; position: absolute; top: 0; bottom: 0; left: 40px; width: 4px;
      background: #f3f4f6; border-radius: 4px;
    }
    
    /* The filled connecting line (Progress) */
    .timeline-progress-line {
      position: absolute; top: 0; left: 40px; width: 4px; background: #2563eb;
      border-radius: 4px; z-index: 1;
      height: 0%; 
      transition: height 1s ease;
    }

    .level-node {
      display: flex; align-items: center; margin-bottom: 24px; position: relative; z-index: 2;
    }
    .level-node:last-child { margin-bottom: 0; }
    
    .node-icon-wrapper {
      width: 84px; display: flex; justify-content: center; flex-shrink: 0;
    }
    
    .node-dot {
      width: 32px; height: 32px; border-radius: 50%; background: #fff;
      border: 4px solid #e5e7eb; display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 800; color: #9ca3af; transition: all 0.3s;
    }
    
    .level-node.completed .node-dot {
      background: #2563eb; border-color: #2563eb; color: #fff;
      box-shadow: 0 0 0 4px rgba(183, 12, 1, 0.2);
    }
    
    .level-node.current .node-dot {
      background: #fff; border-color: #2563eb; color: #2563eb;
      box-shadow: 0 0 0 4px rgba(183, 12, 1, 0.2);
      transform: scale(1.2);
    }

    .node-content {
      background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 16px 20px;
      flex: 1; box-shadow: 0 2px 10px rgba(0,0,0,0.02); transition: transform 0.2s;
    }
    .level-node.current .node-content {
      border-color: #2563eb; box-shadow: 0 4px 15px rgba(183, 12, 1, 0.1);
      transform: translateX(5px);
    }
    .level-node.completed .node-content { opacity: 0.7; }
    
    .level-name { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }
    .level-reward { font-size: 13px; color: #f59e0b; font-weight: 800; display: flex; align-items: center; gap: 4px; }
    .level-desc { font-size: 13px; color: #6b7280; }

    /* The final Level 15 Styling */
    .level-node.final .node-content {
      background: linear-gradient(135deg, #fffbeb 0%, #fff 100%);
      border: 2px solid #f59e0b;
    }
    .level-node.final .level-name { color: #b45309; font-size: 18px; }
    .level-node.final .node-dot { border-color: #f59e0b; color: #f59e0b; width: 40px; height: 40px; font-size: 20px; background: #fffbeb; }

    /* ===========================
       RESPONSIVE
    =========================== */
    @media (max-width: 768px) {
      .topbar__actions { display: none; }
      .page-container { padding: 24px 20px; }
      .promo-banner { flex-direction: column; text-align: center; gap: 20px; padding: 24px; }
      .promo-icon { font-size: 60px; }
      .promo-title { font-size: 24px; }
    }
    @media (max-width: 600px) {
      .main-wrapper { margin-left: 0; max-width: 100%; }
      .topbar { height: 52px; padding: 0 10px; gap: 8px; }
      .topbar__logo img { height: 34px; min-width: 0 !important; }
      .topbar__search { flex: 1; max-width: none; padding: 6px 12px; font-size: 12px; }
      .topbar__search input { font-size: 12px; }
      .timeline::before, .timeline-progress-line { left: 20px; }
      .node-icon-wrapper { width: 44px; }
      .node-content { padding: 12px 16px; }
      .level-name { font-size: 15px; }
      .node-dot { width: 24px; height: 24px; font-size: 12px; border-width: 3px; }
      .level-node.final .node-dot { width: 32px; height: 32px; font-size: 16px; }
    }

    /* ===========================
       DARK MODE
    =========================== */
    :root[data-theme="dark"] body { background: var(--bg-base); }
    :root[data-theme="dark"] .content-area,
    :root[data-theme="dark"] .main-content {
      background: var(--bg-base);
    }
    :root[data-theme="dark"] .status-card,
    :root[data-theme="dark"] .node-content {
      background: var(--bg-card);
      border-color: var(--border);
    }
    :root[data-theme="dark"] .journey-title,
    :root[data-theme="dark"] .status-title,
    :root[data-theme="dark"] .level-name {
      color: var(--text-primary);
    }
    :root[data-theme="dark"] .status-desc,
    :root[data-theme="dark"] .level-desc {
      color: var(--text-muted);
    }
    :root[data-theme="dark"] .timeline::before,
    :root[data-theme="dark"] .progress-bar-container {
      background: #334155 !important;
    }
    :root[data-theme="dark"] .node-dot {
      background: var(--bg-card);
      border-color: #334155;
      color: var(--text-muted);
    }
    :root[data-theme="dark"] .level-node.completed .node-dot {
      background: #2563eb;
      border-color: #2563eb;
      color: #fff;
    }
    :root[data-theme="dark"] .level-node.current .node-dot {
      background: var(--bg-card);
      border-color: #2563eb;
      color: #2563eb;
    }
    :root[data-theme="dark"] .level-node.final .node-content {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, var(--bg-card) 100%);
      border-color: #f59e0b;
    }
    :root[data-theme="dark"] .level-node.final .node-dot {
      background: rgba(245, 158, 11, 0.2);
    }
    :root[data-theme="dark"] .status-card > div[style*="color: #111827"] {
      color: var(--text-primary) !important;
    }
    :root[data-theme="dark"] .congrats-modal {
      background: var(--bg-card);
    }
    :root[data-theme="dark"] .congrats-title {
      color: var(--primary);
    }
    :root[data-theme="dark"] .congrats-desc {
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="app">
    <app-sidebar data-base="../../"></app-sidebar>
    <div class="main-wrapper">

      <!-- TOPBAR -->
      <app-topbar data-base="../../"></app-topbar>

      <!-- CONTENT -->
      <div class="content-area">
        <main class="main-content">
          <div class="page-container">

            <!-- PROMO BANNER -->
            <div class="promo-banner">
              <div class="promo-content">
                <h1 class="promo-title">Win  Cash!</h1>
                <p class="promo-desc">Climb the ranks by taking CBT tests, answering trivia, and participating in group challenges. Reach the highest rank to claim the ultimate prize.</p>
              </div>
              <div class="promo-icon">🏆</div>
            </div>

            <!-- CURRENT STATUS -->
            <div class="status-card">
              <div class="status-icon">🚀</div>
              <div class="status-level">Level 1</div>
              <div class="status-title">Novice</div>
              <div class="status-desc">Just starting out on the journey. Take exams to progress!</div>
              
              <!-- Smooth Progress Bar -->
              <div class="progress-bar-container" style="margin-top: 24px; width: 100%; height: 16px; background: #f3f4f6; border-radius: 9999px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
                <div style="height: 100%; width: 0%; background: #2563eb; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);"></div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase;">
                <span>Level 1</span>
                <span>Level 2</span>
              </div>
              <div style="margin-top: 16px; font-size: 16px; font-weight: 700; color: #111827;">
                Total Points: <span class="status-points" style="color: #2563eb;">0</span>
              </div>
            </div>

            <h2 class="journey-title">Your Progression Journey</h2>

            <!-- TIMELINE -->
            <div class="timeline">
              <div class="timeline-progress-line"></div>

              <!-- Level 1 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">1</div></div>
                <div class="node-content">
                  <div class="level-name">1. Novice</div>
                  <div class="level-desc">Just starting out on the journey.</div>
                </div>
              </div>

              <!-- Level 2 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">2</div></div>
                <div class="node-content">
                  <div class="level-name">2. Beginner</div>
                  <div class="level-desc">Getting the hang of the questions.</div>
                </div>
              </div>

              <!-- Level 3 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">3</div></div>
                <div class="node-content">
                  <div class="level-name">3. Learner</div>
                  <div class="level-desc">Consistent practice makes perfect.</div>
                </div>
              </div>

              <!-- Level 4 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">4</div></div>
                <div class="node-content">
                  <div class="level-name">4. Apprentice</div>
                  <div class="level-desc">Keep learning! You are just a few challenges away from reaching Level 5.</div>
                </div>
              </div>

              <!-- Level 5 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">5</div></div>
                <div class="node-content">
                  <div class="level-name">5. Adept</div>
                  <div class="level-desc">Showing strong potential.</div>
                </div>
              </div>

              <!-- Level 6 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">6</div></div>
                <div class="node-content">
                  <div class="level-name">6. Challenger</div>
                  <div class="level-desc">Ready for tougher questions.</div>
                </div>
              </div>

              <!-- Level 7 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">7</div></div>
                <div class="node-content">
                  <div class="level-name">7. Scholar</div>
                  <div class="level-desc">Demonstrating broad knowledge.</div>
                </div>
              </div>

              <!-- Level 8 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">8</div></div>
                <div class="node-content">
                  <div class="level-name">8. Brainiac</div>
                  <div class="level-desc">A step above the rest.</div>
                </div>
              </div>

              <!-- Level 9 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">9</div></div>
                <div class="node-content">
                  <div class="level-name">9. Expert</div>
                  <div class="level-desc">Very high proficiency achieved.</div>
                </div>
              </div>

              <!-- Level 10 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">10</div></div>
                <div class="node-content">
                  <div class="level-name">10. Master</div>
                  <div class="level-desc">Elite tier of students.</div>
                </div>
              </div>

              <!-- Level 11 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">11</div></div>
                <div class="node-content">
                  <div class="level-name">11. Grandmaster</div>
                  <div class="level-desc">Unstoppable exam cruncher.</div>
                </div>
              </div>

              <!-- Level 12 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">12</div></div>
                <div class="node-content">
                  <div class="level-name">12. Elite</div>
                  <div class="level-desc">Top 1% of the platform.</div>
                </div>
              </div>

              <!-- Level 13 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">13</div></div>
                <div class="node-content">
                  <div class="level-name">13. Champion</div>
                  <div class="level-desc">Dominating all CBT challenges.</div>
                </div>
              </div>

              <!-- Level 14 -->
              <div class="level-node">
                <div class="node-icon-wrapper"><div class="node-dot">14</div></div>
                <div class="node-content">
                  <div class="level-name">14. Legend</div>
                  <div class="level-desc">A true myth in the making.</div>
                </div>
              </div>

              <!-- Level 15 (FINAL) -->
              <div class="level-node final">
                <div class="node-icon-wrapper"><div class="node-dot">👑</div></div>
                <div class="node-content">
                  <div class="level-name">15. Supreme Genius <span class="level-reward"></span></div>
                  <div class="level-desc">The absolute peak. Claim your ultimate cash reward!</div>
                </div>
              </div>

            </div><!-- end timeline -->
            
          </div><!-- end page-container -->
        </main>
      </div>
    </div>
  </div>

  <script defer src="../../components/topbar.js"></script>
  <script defer src="../../components/nav.js"></script>
  <script defer src="../../components/sidebar.js?v=6"></script>
  
  <!-- DYNAMIC RANK LOGIC -->
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  <script src="../../components/supabase.js"></script>
  <style>
    /* CONGRATS POPUP */
    .congrats-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6); z-index: 1000;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none; transition: opacity 0.3s;
      backdrop-filter: blur(4px);
    }
    .congrats-overlay.show { opacity: 1; pointer-events: auto; }
    .congrats-modal {
      background: #fff; border-radius: 24px; padding: 40px; text-align: center; max-width: 400px; width: 90%;
      transform: scale(0.9); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
    .congrats-overlay.show .congrats-modal { transform: scale(1); }
    .congrats-icon { font-size: 64px; margin-bottom: 16px; animation: bounce 2s infinite; }
    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    .congrats-title { font-size: 28px; font-weight: 800; color: #2563eb; margin-bottom: 8px; }
    .congrats-desc { font-size: 16px; color: #6b7280; margin-bottom: 24px; }
    .congrats-btn {
      background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 12px; font-weight: 700;
      font-size: 16px; width: 100%; transition: background 0.2s; border: none; cursor: pointer;
    }
  </style>
  
  <div class="congrats-overlay" id="congrats-overlay">
    <div class="congrats-modal">
      <div class="congrats-icon">🏆</div>
      <div class="congrats-title">Congratulations!</div>
      <div class="congrats-desc" id="congrats-text">You have reached a new rank!</div>
      <button class="congrats-btn" onclick="document.getElementById('congrats-overlay').classList.remove('show')">Keep Grinding</button>
    </div>
  </div>

  <script>
    const RANK_LEVELS = [
      { level: 1, name: "Novice", minPoints: 0, desc: "Just starting out on the journey. Take exams to progress!" },
      { level: 2, name: "Beginner", minPoints: 100, desc: "Getting the hang of the questions." },
      { level: 3, name: "Learner", minPoints: 300, desc: "Consistent practice makes perfect." },
      { level: 4, name: "Apprentice", minPoints: 800, desc: "Keep learning! You are just a few challenges away from reaching Level 5." },
      { level: 5, name: "Adept", minPoints: 1500, desc: "Showing strong potential." },
      { level: 6, name: "Challenger", minPoints: 2500, desc: "Ready for tougher questions." },
      { level: 7, name: "Scholar", minPoints: 4500, desc: "Demonstrating broad knowledge." },
      { level: 8, name: "Brainiac", minPoints: 7000, desc: "A step above the rest." },
      { level: 9, name: "Expert", minPoints: 10000, desc: "Very high proficiency achieved." },
      { level: 10, name: "Master", minPoints: 15000, desc: "Elite tier of students." },
      { level: 11, name: "Grandmaster", minPoints: 25000, desc: "Unstoppable exam cruncher." },
      { level: 12, name: "Elite", minPoints: 40000, desc: "Top 1% of the platform." },
      { level: 13, name: "Champion", minPoints: 65000, desc: "Dominating all CBT challenges." },
      { level: 14, name: "Legend", minPoints: 100000, desc: "A true myth in the making." },
      { level: 15, name: "Supreme Genius", minPoints: 1000000, desc: "The absolute peak.", reward: "" }
    ];

    let globalPoints = 0;

    async function initDynamicRank() {
      if (typeof MECSupabase === 'undefined') {
        setTimeout(initDynamicRank, 500);
        return;
      }
      
      const user = await MECSupabase.getCurrentUser();
      if (!user) {
        document.querySelector('.page-container').innerHTML = 
          <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">🚫</div>
            <h2 style="font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 8px;">Login Required</h2>
            <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px;">You must be logged in to view your rank and progress.</p>
            <button class="btn-register" style="padding: 10px 24px; font-size: 14px;" onclick="if(window.MEC_NAV) window.MEC_NAV.href('login'); else window.location.href='../auth/login.html';">Login / Register</button>
          </div>
        ;
        return;
      }

      const sb = MECSupabase.getSupabase();
      const { data, error } = await sb.from('profiles')
        .select('global_points')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        globalPoints = data.global_points || 0;
      }

      renderDynamicRank();
    }

    function getLevelForPoints(points) {
      let lv = RANK_LEVELS[0];
      for (let i = 0; i < RANK_LEVELS.length; i++) {
        if (points >= RANK_LEVELS[i].minPoints) lv = RANK_LEVELS[i];
        else break;
      }
      return lv;
    }

    function renderDynamicRank() {
      const currentLevelObj = getLevelForPoints(globalPoints);
      const levelIndex = currentLevelObj.level - 1;

      // 1. Update Status Card
      const statusLevel = document.querySelector('.status-level');
      const statusTitle = document.querySelector('.status-title');
      const statusDesc = document.querySelector('.status-desc');
      if (statusLevel) statusLevel.textContent = Level ;
      if (statusTitle) statusTitle.textContent = currentLevelObj.name;
      if (statusDesc) statusDesc.textContent = currentLevelObj.desc;
      const statusPoints = document.querySelector('.status-points');
      if (statusPoints) statusPoints.textContent = globalPoints.toLocaleString();

      // 2. Update Horizontal Bar (EXP Style)
      const horizBarContainer = document.querySelector('.progress-bar-container');
      if (horizBarContainer) {
        // Calculate fraction
        let fraction = 1;
        let nextLevelObj = RANK_LEVELS[14];
        if (levelIndex < 14) {
          nextLevelObj = RANK_LEVELS[levelIndex + 1];
          const ptsNeeded = nextLevelObj.minPoints - currentLevelObj.minPoints;
          const ptsEarned = globalPoints - currentLevelObj.minPoints;
          fraction = Math.min(1, Math.max(0, ptsEarned / ptsNeeded));
        }
        
        horizBarContainer.innerHTML = <div style="height: 100%; width: %; background: #2563eb; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);"></div>;
        
        // Update labels below the bar
        const labelsContainer = horizBarContainer.nextElementSibling;
        if (labelsContainer && labelsContainer.tagName === 'DIV') {
          const spans = labelsContainer.querySelectorAll('span');
          if (spans.length >= 2) {
            spans[0].textContent = Level ;
            spans[1].textContent = levelIndex < 14 ? Level  : 'Max Level';
          }
        }
      }

      // 3. Update Vertical Timeline Nodes
      const levelNodes = document.querySelectorAll('.level-node');
      levelNodes.forEach((node, idx) => {
        node.classList.remove('completed', 'current');
        const dot = node.querySelector('.node-dot');
        if (idx < levelIndex) {
          node.classList.add('completed');
          if (dot) dot.innerHTML = '&#10003;'; // Checkmark ✓
        } else if (idx === levelIndex) {
          node.classList.add('current');
          if (dot && idx !== 14) dot.textContent = (idx + 1).toString();
        } else {
          if (dot && idx !== 14) dot.textContent = (idx + 1).toString();
        }
      });

      // 4. Update Vertical Timeline Progress Line
      const progressLine = document.querySelector('.timeline-progress-line');
      if (progressLine) {
        if (levelIndex === 14) {
          progressLine.style.height = '100%';
        } else {
          const nextLv = RANK_LEVELS[levelIndex + 1];
          const ptsNeeded = nextLv.minPoints - currentLevelObj.minPoints;
          const ptsEarned = globalPoints - currentLevelObj.minPoints;
          const fraction = Math.min(1, Math.max(0, ptsEarned / ptsNeeded));
          
          const basePct = (levelIndex / 14) * 100;
          const extraPct = fraction * (100 / 14);
          progressLine.style.height = ${basePct + extraPct}%;
        }
      }
      
      checkForLevelUps();
    }

    function checkForLevelUps() {
      const storedRank = parseInt(localStorage.getItem('mec_global_rank_level_v3') || '1', 10);
      const currentLvObj = getLevelForPoints(globalPoints);
      const currentLv = currentLvObj.level;
      
      if (currentLv > storedRank && globalPoints > 0) {
        document.getElementById('congrats-text').innerHTML = You have reached <strong></strong>!;
        document.getElementById('congrats-overlay').classList.add('show');
        if (typeof confetti === 'function') {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }
      
      localStorage.setItem('mec_global_rank_level_v3', currentLv.toString());
    }

    document.addEventListener('DOMContentLoaded', initDynamicRank);
  </script>

</body>
</html>
'''

with codecs.open('public/modules/rank/rank.html', 'w', encoding='utf-8') as f:
    f.write(html_content)
