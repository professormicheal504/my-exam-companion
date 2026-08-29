const { chromium } = require('playwright');
const path = require('path');

const FILE_URL = 'file:///c:/myproject/my_exam_companion/public/modules/cbt_test/core/cbt_player.html'
  + '?exam_id=nigeria%2Fjamb'
  + '&data_source=ng%2Fexams%2Funiversity_entrance%2Fjamb%2Findex.json'
  + '&logo=%2Fassets%2Fcountry%2Fnigeria%2Fjamb.png'
  + '&subject=english_language%2Ccomputer_studies'
  + '&year=1978';

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  const logs  = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console',  m => logs.push(`[${m.type()}] ${m.text()}`));

  console.log('1. Navigating to page...');
  await page.goto(FILE_URL, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(()=>{});
  await page.waitForTimeout(5000); // wait for fetch + JS to settle

  // ─── Diagnose: are q-cells rendered with data-qidx? ─────────────────────────
  const cellCount = await page.evaluate(() =>
    document.querySelectorAll('.q-cell[data-qidx]').length
  );
  console.log(`\n2. Cells with [data-qidx]: ${cellCount}`);
  if (cellCount === 0) {
    // Check if grid containers exist
    const tabsDesktop  = await page.evaluate(() => !!document.getElementById('nav-tabs-desktop'));
    const gridsDesktop = await page.evaluate(() => !!document.getElementById('nav-grids-desktop'));
    const oldGrid      = await page.evaluate(() => !!document.getElementById('q-grid-desktop'));
    console.log('   nav-tabs-desktop exists:', tabsDesktop);
    console.log('   nav-grids-desktop exists:', gridsDesktop);
    console.log('   old q-grid-desktop exists:', oldGrid);
    
    // Check if EXAM_DATA was populated
    const examDataLen = await page.evaluate(() => {
      try { return (typeof EXAM_DATA !== 'undefined' && EXAM_DATA.questions) ? EXAM_DATA.questions.length : -1; }
      catch(e) { return 'error: ' + e.message; }
    });
    console.log('   EXAM_DATA.questions.length:', examDataLen);

    // Check answers object
    const answersInfo = await page.evaluate(() => {
      try { return typeof answers !== 'undefined' ? JSON.stringify(answers) : 'undefined'; }
      catch(e) { return 'error'; }
    });
    console.log('   answers object:', answersInfo);
    
    console.log('\n❌ FAIL: No cells rendered — renderGrids() was not called or failed');
  } else {
    console.log('   ✅ Cells rendered correctly');
  }

  // ─── Diagnose: start overlay visible? ────────────────────────────────────────
  const startVisible = await page.evaluate(() => {
    const el = document.getElementById('start-screen-overlay');
    return el ? !el.classList.contains('hidden') : 'not found';
  });
  console.log(`\n3. Start overlay visible: ${startVisible}`);

  // ─── Try to start exam ────────────────────────────────────────────────────────
  const startBtn = page.locator('#btn-start-now');
  const startBtnVisible = await startBtn.isVisible().catch(() => false);
  if (startBtnVisible) {
    console.log('4. Clicking "Start Exam" button...');
    await startBtn.click();
    await page.waitForTimeout(1000);
  } else {
    console.log('4. Start button not visible — may already be started or no overlay');
  }

  // ─── Check cell states BEFORE clicking any option ────────────────────────────
  const cellsBefore = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.q-cell[data-qidx]')).slice(0, 5).map(c => ({
      idx: c.dataset.qidx,
      classes: c.className,
      text: c.textContent.trim()
    }));
  });
  console.log('\n5. Cell states BEFORE option click (first 5):');
  cellsBefore.forEach(c => console.log(`   Cell idx=${c.idx} text="${c.text}" classes="${c.classes}"`));

  // ─── Click option A on Q1 ─────────────────────────────────────────────────────
  const optA = page.locator('#opt-0');
  const optAVisible = await optA.isVisible().catch(() => false);
  if (optAVisible) {
    console.log('\n6. Clicking Option A...');
    await optA.click();
    await page.waitForTimeout(500);

    // Check answers object after click
    const answersAfter = await page.evaluate(() => {
      try { return typeof answers !== 'undefined' ? JSON.stringify(answers) : 'undefined'; }
      catch(e) { return 'error'; }
    });
    console.log('   answers object after click:', answersAfter);

    // Check cell 0 class after click
    const cell0After = await page.evaluate(() => {
      const c = document.querySelector('.q-cell[data-qidx="0"]');
      return c ? c.className : 'not found';
    });
    console.log('   Cell 0 class after click:', cell0After);

    const hasAns = cell0After.includes('ans');
    if (hasAns) {
      console.log('   ✅ PASS: cell[0] has "ans" class — color should be BLUE');
    } else {
      console.log('   ❌ FAIL: cell[0] does NOT have "ans" class after selecting option');

      // Deep diagnosis: check if updateGrids was called
      const updateGridsDefined = await page.evaluate(() => typeof updateGrids === 'function');
      console.log('   updateGrids defined:', updateGridsDefined);

      // Check if renderQuestion calls updateGrids
      const renderQSrc = await page.evaluate(() => {
        try { return renderQuestion.toString().includes('updateGrids'); }
        catch(e) { return 'error: ' + e.message; }
      });
      console.log('   renderQuestion calls updateGrids:', renderQSrc);

      // Manually call updateGrids and see if that fixes it
      await page.evaluate(() => { try { updateGrids(); } catch(e){} });
      const cell0AfterManual = await page.evaluate(() => {
        const c = document.querySelector('.q-cell[data-qidx="0"]');
        return c ? c.className : 'not found';
      });
      console.log('   Cell 0 after MANUAL updateGrids():', cell0AfterManual);
      if (cell0AfterManual.includes('ans')) {
        console.log('   ⚠  ROOT CAUSE: updateGrids() works but is NOT being called by renderQuestion()');
      } else {
        console.log('   ⚠  ROOT CAUSE: answers[0] is not being set, OR cells lack data-qidx');
      }
    }
  } else {
    console.log('\n6. Option A not visible — exam may not have started');
  }

  // ─── Navigate to Q2 and check Q1 turns red (not-ans would be wrong, Q1 is ans) ──
  const nextBtn = page.locator('#qn-next');
  const nextVisible = await nextBtn.isVisible().catch(() => false);
  if (nextVisible) {
    console.log('\n7. Navigating to Q2...');
    await nextBtn.click();
    await page.waitForTimeout(500);

    const cell0Q2 = await page.evaluate(() => {
      const c = document.querySelector('.q-cell[data-qidx="0"]');
      return c ? c.className : 'not found';
    });
    const cell1Q2 = await page.evaluate(() => {
      const c = document.querySelector('.q-cell[data-qidx="1"]');
      return c ? c.className : 'not found';
    });
    console.log('   Cell 0 (Q1 — should be .ans blue):', cell0Q2);
    console.log('   Cell 1 (Q2 — should be .active):', cell1Q2);
    console.log('   Q1 is blue (ans):', cell0Q2.includes('ans') ? '✅' : '❌');
    console.log('   Q2 is active:', cell1Q2.includes('active') ? '✅' : '❌');
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n─── JS ERRORS ───');
  if (errors.length === 0) console.log('   None');
  errors.forEach(e => console.log('  ❌', e.slice(0, 300)));

  console.log('\n─── CBT LOG ───');
  logs.filter(l => l.includes('[CBT]') || l.includes('error')).forEach(l => console.log(' ', l));

  await browser.close();
}

runTest().catch(e => { console.error('Test crashed:', e); process.exit(1); });
