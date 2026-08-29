const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  const logs = [];
  p.on('console', m => logs.push(`[${m.type()}] ${m.text()}`));
  
  console.log('Navigating to cbt_player.html...');
  await p.goto(
    'file:///c:/myproject/my_exam_companion/public/modules/cbt_test/core/cbt_player.html?exam_id=nigeria%2Fjamb&subject=english_language%2Ccomputer_studies&year=1978',
    { waitUntil: 'domcontentloaded', timeout: 20000 }
  ).catch(()=>{});
  
  await p.waitForTimeout(6000);
  
  console.log('Clicking Start Exam...');
  await p.locator('#btn-start-now').click().catch(()=>{});
  await p.waitForTimeout(1000);
  
  console.log('Clicking AI Generation Button...');
  // Find the button that triggers generateExplanation()
  // Since it might be injected dynamically if no explanation exists, wait for it
  const generateBtn = p.locator('button.btn-ai-generate');
  
  if (await generateBtn.isVisible().catch(()=>false)) {
    console.log('Found AI generate button, clicking...');
    
    // Listen for the fetch request to our local server
    p.on('request', req => {
      if (req.url().includes('explain-question')) {
        console.log(`\n➡️  Network Request Sent: ${req.method()} ${req.url()}`);
      }
    });
    
    p.on('response', async res => {
      if (res.url().includes('explain-question')) {
        console.log(`\n⬅️  Network Response Received: HTTP ${res.status()}`);
        try {
          const json = await res.json();
          console.log('Response JSON:', JSON.stringify(json).slice(0, 300) + '...');
        } catch (e) {
          console.log('Response body could not be parsed as JSON');
        }
      }
    });

    await generateBtn.click();
    
    // Wait for the AI Explanation popup to show some content
    console.log('\nWaiting 10 seconds for AI to generate response...');
    await p.waitForTimeout(10000);
    
    const popupContent = await p.evaluate(() => {
      const el = document.getElementById('ai-fab-content-inject');
      return el ? el.innerHTML : 'NOT FOUND';
    });
    console.log('\n--- Final HTML inside AI popup ---');
    console.log(popupContent.slice(0, 500));
    console.log('----------------------------------\n');
    
  } else {
    console.log('AI Generate button not visible! Check if an explanation already exists for this question.');
  }
  
  await b.close();
  
  // Cleanly kill the background server if we can
  process.exit(0);
})();
