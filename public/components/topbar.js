/* ═══════════════════════════════════════════════════
   <app-topbar> — Chess.com style top bar
═══════════════════════════════════════════════════ */
(function() {
  const t = localStorage.getItem('mec_theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);

  // --- ANTI-INSPECT / CONSOLE LOCK ---
  document.addEventListener('contextmenu', e => e.preventDefault());
  // Use capture:true only for known devtools keys; avoid swallowing all events
  document.addEventListener('keydown', function(e) {
    const key = e.key || '';
    const code = e.keyCode || 0;
    // F12
    if (code === 123 || key === 'F12') { e.preventDefault(); e.stopImmediatePropagation(); return; }
    // Ctrl/Cmd + Shift + I/J/C  (DevTools panels)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && /^[ijcIJC]$/.test(key)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    // Ctrl/Cmd + U (View Source)
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && /^[uU]$/.test(key)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    // Ctrl/Cmd + S (Save page) — allow normal S keystrokes (inputs) through
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && /^[sS]$/.test(key)) { e.preventDefault(); e.stopImmediatePropagation(); return; }
  }, true); // capture=true only for this specific handler

  // Devtools Debugger Trap (Freezes DevTools if opened via browser menu)
  setInterval(function() {
    (function() { return false; })["constructor"]("debugger")();
  }, 100);

  setInterval(() => {
    console.clear();
    console.log("%cStop!", "color: red; font-size: 50px; font-weight: bold; -webkit-text-stroke: 1px black;");
    console.log("%cThis is a browser feature intended for developers. Do not paste any code here.", "font-size: 16px; font-weight: bold;");
  }, 1000);
})();

window.handleMecLogout = async function() {
  if (typeof window.MECSupabase !== 'undefined') {
    const sb = window.MECSupabase.getSupabase();
    if (sb) {
      try { await sb.auth.signOut(); } catch(e) {}
    }
  }
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('sb-alwplfsqzrijxqujrpyu-auth-token');
  
  // Clear any publisher program drafts to prevent state leakage across accounts
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('pub_draft_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  window.location.reload();
};

class AppTopbar extends HTMLElement {
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
    
    this.render();
    
    // Add top padding to account for fixed topbar globally
    document.body.style.paddingTop = '56px';
    
    // Initialize mobile smart scroll
    this.initSmartScroll();
  }

  initSmartScroll() {
    let lastScrollY = window.scrollY;
    let isHidden = false;

    window.addEventListener('scroll', () => {
      // Only apply smart scroll on mobile screens (< 768px)
      if (window.innerWidth >= 768) {
        if (isHidden) {
          this.classList.remove('topbar-hidden');
          isHidden = false;
        }
        return;
      }

      const currentScrollY = window.scrollY;
      
      // If we're at the very top, always show
      if (currentScrollY <= 0) {
        this.classList.remove('topbar-hidden');
        isHidden = false;
        lastScrollY = currentScrollY;
        return;
      }

      // Scrolling down (and past a small threshold to avoid jitter)
      if (currentScrollY > lastScrollY && currentScrollY > 56) {
        if (!isHidden) {
          this.classList.add('topbar-hidden');
          isHidden = true;
        }
      } 
      // Scrolling up
      else if (currentScrollY < lastScrollY) {
        if (isHidden) {
          this.classList.remove('topbar-hidden');
          isHidden = false;
        }
      }

      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  render() {
    // Check for Supabase session token
    const sbTokenStr = localStorage.getItem('sb-alwplfsqzrijxqujrpyu-auth-token');
    const isLoggedIn = (sbTokenStr !== null);

    // --- GLOBAL AUTH GUARD ---
    if (isLoggedIn && !window.location.pathname.includes('fill_form.html')) {
      try {
        const sessionObj = JSON.parse(sbTokenStr);
        if (sessionObj && sessionObj.user && sessionObj.access_token) {
          const userId = sessionObj.user.id;
          
          const checkProfile = () => {
            if (typeof window.MECSupabase === 'undefined') {
              // Dynamically load supabase if missing
              if (!document.getElementById('mec-supabase-core-script')) {
                const s1 = document.createElement('script');
                s1.id = 'mec-supabase-core-script';
                s1.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
                document.head.appendChild(s1);
                
                const s2 = document.createElement('script');
                s2.id = 'mec-supabase-wrapper-script';
                // Find base path safely for components folder
                let componentBase = this.base;
                if (!componentBase.endsWith('/')) componentBase += '/';
                s2.src = componentBase + 'components/supabase.js';
                s1.onload = () => document.head.appendChild(s2);
              }
              // Wait for supabase.js to load
              setTimeout(checkProfile, 50);
              return;
            }
            const sb = window.MECSupabase.getSupabase();
            if (!sb) return;

            sb.from('profiles').select('id,avatar_url,full_name,email,exam_id').eq('id', userId)
            .then(({ data, error }) => {
              if (error) {
                 console.warn("Session invalid (user deleted or expired). Logging out...");
                 window.handleMecLogout();
                 return;
              }
              
              if (!data || data.length === 0) {
                // If profile doesn't exist, redirect to fill_form.html (prevent infinite loop by checking path first)
                if (!window.location.pathname.includes('fill_form.html')) {
                  const publicIdx = window.location.pathname.indexOf('/public/');
                  let redirectPath = '/modules/auth/fill_form.html';
                  if (publicIdx !== -1) {
                    redirectPath = window.location.pathname.substring(0, publicIdx + 8) + 'modules/auth/fill_form.html';
                  } else {
                    redirectPath = this.base + 'modules/auth/fill_form.html';
                  }
                  window.location.href = redirectPath;
                }
              } else {
                // Profile exists!
                
                // If they somehow navigated to fill_form.html but already have a profile, redirect them home!
                if (window.location.pathname.includes('fill_form.html')) {
                  const publicIdx = window.location.pathname.indexOf('/public/');
                  let redirectHome = '/modules/index.html';
                  if (publicIdx !== -1) {
                    redirectHome = window.location.pathname.substring(0, publicIdx + 8) + 'modules/index.html';
                  } else {
                    redirectHome = this.base + 'modules/index.html';
                  }
                  window.location.href = redirectHome;
                  return;
                }

                // Update UI
                const profile = data[0];
                let displayName = 'Student';
                if (profile.full_name) {
                  displayName = profile.full_name;
                } else if (sessionObj.user.user_metadata && sessionObj.user.user_metadata.full_name) {
                  displayName = sessionObj.user.user_metadata.full_name;
                } else if (sessionObj.user.email) {
                  displayName = sessionObj.user.email.split('@')[0];
                }
                profile.display_name = displayName;
                
                if (profile && profile.avatar_url) {
                  localStorage.setItem('mec_cached_avatar', profile.avatar_url);
                  const profileBtn = this.querySelector('#mec-profile-btn');
                  if (profileBtn) {
                    profileBtn.innerHTML = `<img src="${profile.avatar_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Profile" />`;
                    profileBtn.style.padding = '0';
                    profileBtn.style.overflow = 'hidden';
                  }
                  const dropdownImg = this.querySelector('#mec-profile-avatar-lg');
                  if (dropdownImg) {
                    dropdownImg.src = profile.avatar_url;
                    dropdownImg.style.display = 'block';
                  }
                }
                
                // Notify other scripts
                document.dispatchEvent(new CustomEvent('mec-profile-loaded', { detail: profile }));
              }
            }).catch(console.error);
          };
          
          checkProfile();
        }
      } catch (e) {
        console.error("Auth guard error:", e);
      }
    }
    // -------------------------

    // Dynamically compute home URL for all environments (file://, local dev server, and production)
    let homeUrl = '/modules/index.html';
    if (window.location.protocol === 'file:') {
      const path = window.location.pathname;
      const publicIdx = path.indexOf('/public/');
      if (publicIdx !== -1) {
        homeUrl = 'file://' + path.substring(0, publicIdx + 8) + 'modules/index.html';
      } else {
        homeUrl = `${this.base}modules/index.html`;
      }
    } else {
      // Smart routing: use /public/modules locally, /modules on Firebase/Production
      if (window.location.pathname.includes('/public/')) {
        homeUrl = '/public/modules/index.html';
      }
    }

    this.innerHTML = `
      <nav class="mec-topbar" role="banner">

        <!-- LEFT: hamburger + logo -->
        <div class="mec-topbar__left">

          <button class="mec-sb-toggle" id="mec-sb-toggle" aria-label="Toggle sidebar" title="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <!-- Text Logo — matches original bubbly style -->
          <a class="mec-topbar__logo" href="${homeUrl}" aria-label="My Exam Companion home">
            <span class="mec-logo-text" aria-label="My Exam Companion">
              <span class="mec-logo-line1">My Exam</span>
              <span class="mec-logo-line2">Companion</span>
            </span>
          </a>
        </div>

        <!-- RIGHT: icons or login -->
        <div class="mec-topbar__right">
          <!-- Country Switcher (Always visible) -->
          <div class="mec-country-switcher" id="mec-country-switcher" style="position:relative; margin-right: 6px; flex-shrink: 0;">
            <button class="mec-tb-btn mec-tb-btn--flag" id="mec-country-btn" title="Switch Country" aria-label="Switch Country" style="width: auto; height: auto; padding: 2px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 1; transition: opacity 0.15s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
              <img id="mec-country-flag" src="${this.base}assets/flags/nigeria.svg" style="width: 26px; height: 26px; object-fit: cover; border-radius: 50%; display: block; box-shadow: 0 1px 3px rgba(0,0,0,0.15); flex-shrink: 0;" alt="Country Flag" />
            </button>
            <div id="mec-country-dropdown" style="display:none;position:absolute;top:calc(100% + 8px);right:0;z-index:9999;background:white;border:1px solid #ededed;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.1);min-width:180px;overflow:hidden;">
              <div style="padding:8px 0;">
                <div style="padding:6px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;">Select Country</div>
                <button class="mec-country-opt" data-code="ng" data-name="Nigeria" style="display:flex;align-items:center;gap:10px;width:100%;padding:9px 14px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:500;color:#131212;text-align:left;transition:background 0.1s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
                  <img src="${this.base}assets/flags/nigeria.svg" style="width: 24px; height: 24px; object-fit: cover; border-radius: 50%; display: block; box-shadow: 0 1px 2px rgba(0,0,0,0.15);" alt="NG" /> Nigeria
                </button>
                <button class="mec-country-opt" data-code="us" data-name="United States" style="display:flex;align-items:center;gap:10px;width:100%;padding:9px 14px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:500;color:#131212;text-align:left;transition:background 0.1s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
                  <img src="${this.base}assets/flags/unitedStates.svg" style="width: 24px; height: 24px; object-fit: cover; border-radius: 50%; display: block; box-shadow: 0 1px 2px rgba(0,0,0,0.15);" alt="US" /> United States
                </button>
                <button class="mec-country-opt" data-code="gh" data-name="Ghana" style="display:flex;align-items:center;gap:10px;width:100%;padding:9px 14px;background:none;border:none;cursor:pointer;font-size:13px;font-weight:500;color:#131212;text-align:left;transition:background 0.1s;" onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background='none'">
                  <img src="${this.base}assets/flags/ghana.svg" style="width: 24px; height: 24px; object-fit: cover; border-radius: 50%; display: block; box-shadow: 0 1px 2px rgba(0,0,0,0.15);" alt="GH" /> Ghana
                </button>
              </div>
            </div>
          </div>

          <!-- Theme Toggle (Always visible) -->
          <div class="mec-theme-toggle">
            <label class="mec-theme-label" aria-label="Toggle Dark Mode" title="Toggle Dark Mode">
              <input type="checkbox" id="mec-theme-checkbox" style="display:none;" />
              <div class="mec-theme-slider">
                <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              </div>
            </label>
          </div>

          ${isLoggedIn ? `
            <!-- Search -->
            <button class="mec-tb-btn" title="Search" aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            <!-- Notifications -->
            <div style="position: relative; display: inline-block;">
              <button class="mec-tb-btn" id="mec-notif-btn" title="Notifications" aria-label="Notifications">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span class="mec-tb-badge">2</span>
              </button>
              <div id="mec-notif-dropdown" style="display: none; position: absolute; top: calc(100% + 12px); right: -12px; z-index: 9999; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.05), 0 25px 50px -12px rgba(0,0,0,0.1); border-radius: 20px;"></div>
            </div>

            <!-- Profile / Account -->
            <div style="position: relative; display: inline-block;">
              <button class="mec-tb-profile" id="mec-profile-btn" title="My Account" aria-label="My account">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </button>
              <div id="mec-profile-dropdown" style="display: none; position: absolute; top: calc(100% + 12px); right: 0; z-index: 9999; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.05), 0 25px 50px -12px rgba(0,0,0,0.1); border-radius: 16px; background: var(--bg-card); border: 1px solid var(--border); min-width: 240px; padding: 16px; text-align: left;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                  <img id="mec-profile-avatar-lg" src="" style="display: none; width: 44px; height: 44px; border-radius: 50%; object-fit: cover; background: #f3f4f6;" alt="Avatar" />
                  <div style="overflow: hidden; flex: 1;">
                    <div id="mec-profile-name" style="font-weight: 700; color: #131212; font-size: 15px; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">My Account</div>
                    <div id="mec-profile-email" style="font-size: 13px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></div>
                  </div>
                </div>
                <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 0 -16px 12px -16px;">
                <hr style="border: none; border-top: 1px solid var(--border); margin: 0 -16px 12px -16px;">
                <button onclick="window.handleMecLogout()" style="width: 100%; padding: 10px; border-radius: 8px; border: none; background: #fef2f2; color: #2563eb; font-weight: 600; cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fef2f2'">
                  Log Out
                </button>
              </div>
            </div>
          ` : `
            <a href="${this.base}modules/auth/login.html" class="mec-auth-login" style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 600; color: var(--text-primary); border: 1px solid var(--border); background: var(--bg-card); text-decoration: none; white-space: nowrap; flex-shrink: 0;">Login</a>
            <a href="${this.base}modules/auth/sign_up.html" class="mec-auth-signup" style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 600; color: white; background: #131212; border: 1px solid #131212; text-decoration: none; display: inline-block; white-space: nowrap; flex-shrink: 0;">Sign Up</a>
          `}
        </div>
      </nav>
    `;

    // Wire hamburger to sidebar
    this.querySelector('#mec-sb-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      mecToggleSidebar();
    });

    // Wire theme toggle
    const themeCheckbox = this.querySelector('#mec-theme-checkbox');
    if (themeCheckbox) {
      themeCheckbox.checked = (document.documentElement.getAttribute('data-theme') === 'dark');
      
      const themeLabel = this.querySelector('.mec-theme-label');
      themeLabel.addEventListener('click', (e) => {
        // Prevent default label click double-firing
        e.preventDefault();
        e.stopPropagation();
        
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('mec_theme', next);
        themeCheckbox.checked = (next === 'dark');
        
        // Dispatch event for other components (like cbt_player)
        document.dispatchEvent(new CustomEvent('mec-theme-changed', { detail: next }));
      });
    }

    // Wire country switcher
    const countryBtn = this.querySelector('#mec-country-btn');
    const countryDropdown = this.querySelector('#mec-country-dropdown');
    const countryFlag = this.querySelector('#mec-country-flag');

    if (countryBtn && countryDropdown) {
      const countryMap = {
        'ng': 'nigeria',
        'us': 'unitedStates',
        'gh': 'ghana'
      };

      // Restore saved country flag on load (Check URL first, then localStorage)
      const urlParams = new URLSearchParams(window.location.search);
      let urlCountry = urlParams.get('country');
      if (urlCountry && !countryMap[urlCountry] && urlCountry !== 'all') { urlCountry = null; }
      
      const savedCode = urlCountry || localStorage.getItem('mec_country') || 'ng';
      if (urlCountry) {
        localStorage.setItem('mec_country', savedCode);
      }
      
      if (countryFlag) {
        const flagName = countryMap[savedCode] || 'nigeria';
        countryFlag.src = `${this.base}assets/flags/${flagName}.svg`;
      }

      // Toggle dropdown
      countryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const hidden = countryDropdown.style.display === 'none';
        countryDropdown.style.display = hidden ? 'block' : 'none';
      });

      // Handle country option selection
      this.querySelectorAll('.mec-country-opt').forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          if (opt.disabled) return;
          const code = opt.dataset.code;
          localStorage.setItem('mec_country', code);
          if (countryFlag) {
            const flagName = countryMap[code] || 'nigeria';
            countryFlag.src = `${this.base}assets/flags/${flagName}.svg`;
          }
          countryDropdown.style.display = 'none';
          
          // Update URL dynamically
          const url = new URL(window.location.href);
          url.searchParams.set('country', code);
          window.history.pushState({}, '', url);

          // Dispatch event so pages can react without a full reload
          document.dispatchEvent(new CustomEvent('country-changed', { detail: { code } }));
        });
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!countryDropdown.contains(e.target) && !countryBtn.contains(e.target)) {
          countryDropdown.style.display = 'none';
        }
      });
    }

    // Wire notification dropdown
    const notifBtn = this.querySelector('#mec-notif-btn');
    const notifDropdown = this.querySelector('#mec-notif-dropdown');

    if (notifBtn && notifDropdown) {
      notifBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        // Toggle display
        const isHidden = notifDropdown.style.display === 'none';

        if (isHidden) {
          // Fetch content if it hasn't been loaded yet
          if (!notifDropdown.dataset.loaded) {
            notifBtn.style.opacity = '0.5'; // loading indicator
            try {
              const res = await fetch(this.base + 'app_bar/notification.html');
              if (res.ok) {
                const html = await res.text();
                notifDropdown.innerHTML = html;
                notifDropdown.dataset.loaded = 'true';
              } else {
                console.error('Failed to fetch notification.html:', res.statusText);
              }
            } catch (err) {
              console.error('Failed to load notifications', err);
            } finally {
              notifBtn.style.opacity = '1';
            }
          }
          notifDropdown.style.display = 'block';
        } else {
          notifDropdown.style.display = 'none';
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
          notifDropdown.style.display = 'none';
        }
      });
    }

    // Wire profile dropdown
    const profileBtn = this.querySelector('#mec-profile-btn');
    const profileDropdown = this.querySelector('#mec-profile-dropdown');
    
    if (profileBtn && profileDropdown) {
      // Parse User info from Supabase session
      try {
        const sbToken = localStorage.getItem('sb-alwplfsqzrijxqujrpyu-auth-token');
        if (sbToken) {
          const sessionObj = JSON.parse(sbToken);
          if (sessionObj && sessionObj.user) {
            const email = sessionObj.user.email || 'No email';
            let name = 'My Account';
            
            // Try to extract name from metadata, else use email prefix
            if (sessionObj.user.user_metadata) {
              name = sessionObj.user.user_metadata.full_name || sessionObj.user.user_metadata.name || name;
            }
            if (!name && sessionObj.user.email) {
              name = sessionObj.user.email.split('@')[0];
            }
            
            // Extract avatar
            let avatarUrl = localStorage.getItem('mec_cached_avatar');
            if (!avatarUrl && sessionObj.user.user_metadata) {
              avatarUrl = sessionObj.user.user_metadata.avatar_url || sessionObj.user.user_metadata.picture;
            }
            
            this.querySelector('#mec-profile-name').innerText = name;
            this.querySelector('#mec-profile-email').innerText = email;

            // If avatar exists, update the profile icon and the dropdown image
            if (avatarUrl) {
              profileBtn.innerHTML = `<img src="${avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Profile" />`;
              profileBtn.style.padding = '0';
              profileBtn.style.overflow = 'hidden';
              
              const dropdownImg = this.querySelector('#mec-profile-avatar-lg');
              if (dropdownImg) {
                dropdownImg.src = avatarUrl;
                dropdownImg.style.display = 'block';
              }
            }
          }
        }
      } catch (e) {
        console.error("Error parsing user profile data", e);
      }

      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = profileDropdown.style.display === 'none';
        profileDropdown.style.display = isHidden ? 'block' : 'none';
      });

      document.addEventListener('click', (e) => {
        if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
          profileDropdown.style.display = 'none';
        }
      });
    }
  }
}

customElements.define('app-topbar', AppTopbar);
