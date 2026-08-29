const fs = require('fs');
let content = fs.readFileSync('public/modules/rank/rank.html', 'utf8');

// Replace 1: Add total points
content = content.replace(
  '<span>Level 15 (Max)</span>\r\n              </div>\r\n            </div>',
  <span>Level 15 (Max)</span>
              </div>
              <div style="margin-top: 16px; font-size: 16px; font-weight: 700; color: #111827;">
                Total Points: <span class="status-points" style="color: #2563eb;">0</span>
              </div>
            </div>
);

// Replace 2: Auth Check
content = content.replace(
  'const user = await MECSupabase.getCurrentUser();\r\n      if (!user) return;',
  const user = await MECSupabase.getCurrentUser();
      if (!user) {
        document.querySelector('.page-container').innerHTML = \
          <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">??</div>
            <h2 style="font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 8px;">Login Required</h2>
            <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px;">You must be logged in to view your rank and progress.</p>
            <button class="btn-register" style="padding: 10px 24px; font-size: 14px;" onclick="if(window.MEC_NAV) window.MEC_NAV.href('login'); else window.location.href='../auth/login.html';">Login / Register</button>
          </div>
        \;
        return;
      }
);

// Replace 3: Display Points
content = content.replace(
  'if (statusDesc) statusDesc.textContent = currentLevelObj.desc;',
  if (statusDesc) statusDesc.textContent = currentLevelObj.desc;
      const statusPoints = document.querySelector('.status-points');
      if (statusPoints) statusPoints.textContent = globalPoints.toLocaleString();
);

fs.writeFileSync('public/modules/rank/rank.html', content);
console.log('Replaced successfully');
