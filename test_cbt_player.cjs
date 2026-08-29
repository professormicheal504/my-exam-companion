const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('file:///C:/myproject/my_exam_companion/public/modules/cbt_test/core/cbt_player.html?exam_id=jamb&year=2012&subjects=biology', { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(5000);
  
  try {
    const btn = await page.locator('#btn-start-now');
    await btn.click({ timeout: 2000 });
    await page.waitForTimeout(2000);
  } catch(e) {}
  
  await browser.close();
})();
