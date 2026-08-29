const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  
  // Set up fake localStorage result so it doesn't default to practice mode
  await p.goto('file:///c:/myproject/my_exam_companion/public/modules/cbt_test/core/result.html');
  await p.evaluate(() => {
    // Inject fake user context
    window.MECSupabase = {
      getCurrentUser: async () => ({
        id: '123-abc',
        email: 'test@example.com',
        user_metadata: { full_name: 'John Doe' } // no exam_id in metadata
      })
    };
    window.getSupabase = () => ({
      from: (table) => ({
        select: (fields) => ({
          eq: (col, val) => ({
            single: async () => ({ data: { exam_id: 'MATRIC_999' }, error: null })
          })
        })
      })
    });
  });
  
  // Let the page re-run populateUserInfo() if we re-trigger it
  await p.evaluate(async () => {
    // Re-run the function since we overwrote the globals after load
    if (typeof populateUserInfo !== 'undefined') {
      await populateUserInfo();
    }
  });
  
  await p.waitForTimeout(500);
  
  const name = await p.locator('#info-name').textContent();
  const reg = await p.locator('#info-reg').textContent();
  
  console.log('--- UI Check Before Fix ---');
  console.log('Name:', name);
  console.log('Reg Number (from UI):', reg);
  
  await b.close();
})();
