/* ═══════════════════════════════════════════════════
   <app-topbar> — Chess.com style top bar
═══════════════════════════════════════════════════ */
class AppTopbar extends HTMLElement {
  connectedCallback() {
    this.base = this.getAttribute('data-base') || './';
    this.render();
  }

  render() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    this.innerHTML = `
      <nav class="mec-topbar" role="banner">

        <!-- LEFT: hamburger + logo -->
        <div class="mec-topbar__left">

          <!-- Hamburger toggle -->
          <button class="mec-sb-toggle" id="mec-sb-toggle" aria-label="Toggle sidebar" title="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="3" y1="7"  x2="21" y2="7"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="17" x2="21" y2="17"/>
            </svg>
          </button>

          <!-- Text Logo — matches original bubbly style -->
          <a class="mec-topbar__logo" href="${this.base}index.html" aria-label="My Exam Companion home">
            <span class="mec-logo-text" aria-label="My Exam Companion">
              <span class="mec-logo-line1">My Exam</span>
              <span class="mec-logo-line2">Companion</span>
            </span>
          </a>
        </div>

        <!-- RIGHT: icons or login -->
        <div class="mec-topbar__right">
          ${isLoggedIn ? `
            <!-- Search -->
            <button class="mec-tb-btn" title="Search" aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>

            <!-- Nigeria flag -->
            <button class="mec-tb-btn mec-tb-btn--flag" title="Nigeria" aria-label="Nigeria region">
              <svg class="mec-flag-svg" viewBox="0 0 3 2" aria-hidden="true">
                <rect width="1" height="2" fill="#008751"/>
                <rect x="1" width="1" height="2" fill="#ffffff"/>
                <rect x="2" width="1" height="2" fill="#008751"/>
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
            <button class="mec-tb-profile" title="My Account" aria-label="My account" onclick="localStorage.removeItem('isLoggedIn'); window.location.reload();">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </button>
          ` : `
            <a href="${this.base}auth/login.html" style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 600; color: #131212; border: 1px solid #ddd; background: white; text-decoration: none;">Login</a>
            <a href="${this.base}auth/sign_up.html" style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 600; color: white; background: #131212; border: 1px solid #131212; text-decoration: none; display: inline-block;">Sign Up</a>
          `}
        </div>
      </nav>
    `;

    // Wire hamburger to sidebar
    this.querySelector('#mec-sb-toggle').addEventListener('click', (e) => {
      e.stopPropagation();
      mecToggleSidebar();
    });

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
  }
}

customElements.define('app-topbar', AppTopbar);
