const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigating to ai_plan.html...');
  await page.goto('file:///c:/myproject/my_exam_companion/public/modules/cbt_test/core/ai_plan.html');
  
  // Set fake CBT result in local storage
  await page.evaluate(() => {
    localStorage.setItem('cbt_result', JSON.stringify({
      title: 'JAMB Mock Exam 2024',
      totalScore: 45,
      maxScore: 100,
      questions: [
        { subject: 'English', topic: 'Lexis and Structure', correct: '0' },
        { subject: 'Math', topic: 'Algebra', correct: '1' }
      ],
      answers: ['0', '2'] // 1 correct, 1 wrong
    }));
  });
  
  console.log('Reloading to apply state...');
  await page.reload();
  await page.waitForTimeout(1000);
  
  console.log('Typing message to AI...');
  await page.fill('#chat-input', 'Hello! What should I study next?');
  await page.click('#send-btn');
  
  console.log('Waiting for AI response (up to 15s)...');
  
  // Wait for the AI chat bubble to appear (not the typing indicator)
  try {
    await page.waitForFunction(() => {
      const msgs = document.querySelectorAll('.chat-msg.ai .chat-bubble');
      // Look for a bubble that doesn't have the typing animation
      return Array.from(msgs).some(b => !b.querySelector('.typing'));
    }, { timeout: 15000 });
    
    const responses = await page.evaluate(() => {
      const msgs = document.querySelectorAll('.chat-msg.ai .chat-bubble');
      return Array.from(msgs).filter(b => !b.querySelector('.typing')).map(b => b.innerText);
    });
    
    console.log('\n--- SUCCESS! AI responded with ---');
    console.log(responses[responses.length - 1]);
  } catch (err) {
    console.log('\n--- FAILED! AI did not respond in time ---');
    console.error(err);
  }
  
  await browser.close();
})();
