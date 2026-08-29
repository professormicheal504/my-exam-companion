const {chromium} = require('playwright');
(async () => {
  const b = await chromium.launch({headless:true});
  const p = await b.newPage();
  await p.emulateMedia({colorScheme:'dark'});
  await p.goto(
    'file:///c:/myproject/my_exam_companion/public/modules/cbt_test/core/cbt_player.html?exam_id=nigeria%2Fjamb&subject=english_language%2Ccomputer_studies&year=1978',
    {waitUntil:'domcontentloaded', timeout:20000}
  ).catch(()=>{});
  // Apply dark theme
  await p.evaluate(() => {
    localStorage.setItem('mec_theme','dark');
    document.documentElement.setAttribute('data-theme','dark');
  });
  await p.waitForTimeout(7000);
  await p.locator('#btn-start-now').click().catch(()=>{});
  await p.waitForTimeout(500);
  await p.locator('#opt-0').click().catch(()=>{});
  await p.waitForTimeout(300);

  const cell0 = await p.evaluate(() => {
    const c = document.querySelector('.q-cell[data-qidx="0"]');
    if (!c) return 'NOT FOUND';
    const s = getComputedStyle(c);
    return { classes: c.className, bg: s.backgroundColor };
  });
  console.log('Cell 0 after click:', JSON.stringify(cell0));

  await p.locator('#qn-next').click().catch(()=>{});
  await p.waitForTimeout(300);

  const q1 = await p.evaluate(() => {
    const c = document.querySelector('.q-cell[data-qidx="0"]');
    if (!c) return 'NOT FOUND';
    return { classes: c.className, bg: getComputedStyle(c).backgroundColor };
  });
  const q2 = await p.evaluate(() => {
    const c = document.querySelector('.q-cell[data-qidx="1"]');
    if (!c) return 'NOT FOUND';
    return { classes: c.className, bg: getComputedStyle(c).backgroundColor };
  });

  console.log('Q1 (should be blue):', JSON.stringify(q1));
  console.log('Q2 (should be red):', JSON.stringify(q2));

  // rgb(59,130,246)=blue in dark mode, rgb(37,99,235)=blue in light, rgb(239,68,68)=red
  const q1Blue = q1.bg && (q1.bg.includes('59, 130') || q1.bg.includes('37, 99'));
  const q2Red  = q2.bg && q2.bg.includes('239, 68');
  console.log('Q1 BLUE:', q1Blue ? 'PASS' : 'FAIL - bg=' + q1.bg);
  console.log('Q2 RED:', q2Red  ? 'PASS' : 'FAIL - bg=' + q2.bg);

  await b.close();
})();
