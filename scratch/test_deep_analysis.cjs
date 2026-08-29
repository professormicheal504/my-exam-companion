const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  
  // Set up fake localStorage cbt_result
  await p.goto('file:///c:/myproject/my_exam_companion/public/modules/cbt_test/core/deep_analysis.html');
  await p.evaluate(() => {
    localStorage.setItem('cbt_result', JSON.stringify({
      questions: [
        { subject: 'Math', topic: 'Algebra', correct: '0' },
        { subject: 'Math', topic: 'Calculus', correct: '1' }
      ],
      answers: ['0', '2']
    }));
  });
  
  // Reload page to trigger DOMContentLoaded with the fake storage
  await p.reload();
  await p.waitForTimeout(500);
  
  const text = await p.locator('body').innerText();
  
  console.log('--- UI Check After Fix ---');
  if (text.includes('No recent exam data found')) {
    console.log('BUG STILL EXISTS: Shows no exam data');
  } else if (text.includes('Math')) {
    console.log('SUCCESS: Shows subject data!');
  } else {
    console.log('UNKNOWN STATE:', text.substring(0, 200));
  }
  
  await b.close();
})();
