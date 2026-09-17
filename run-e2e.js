import { chromium } from 'playwright';
import { spawn } from 'child_process';

(async () => {
  console.log('Starting local dev server...');
  const server = spawn('npm run start', { stdio: 'pipe', shell: true });

  let serverStarted = false;

  server.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(`[Server] ${text}`);
    if (text.includes('Server is running on port')) {
      serverStarted = true;
    }
  });

  server.stderr.on('data', (data) => {
    console.error(`[Server Error] ${data}`);
  });

  // Wait for server to be ready
  let retries = 40; // 20 seconds wait
  while (!serverStarted && retries > 0) {
    await new Promise(resolve => setTimeout(resolve, 500));
    retries--;
  }

  if (!serverStarted) {
    console.error('Server failed to start in time.');
    server.kill();
    process.exit(1);
  }

  console.log('Server started. Launching headless browser...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Mocking API endpoint...');
  await page.route('/api/poll', async route => {
    console.log('[Mock] Intercepted /api/poll');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, counts: { A: 1 } }) });
  });

  const targetUrl = 'http://localhost:5000/modules/study/classroom/classroom_discussion.html?exam_id=nigeria/jamb&subject=english_language&year=2024&q=2024_q1&mode=poll';
  console.log('Navigating to:', targetUrl);
  
  await page.goto(targetUrl);
  
  console.log('Waiting for poll options...');
  await page.waitForSelector('.poll-option', { state: 'visible', timeout: 15000 });

  console.log('Clicking the first poll option...');
  await page.click('.poll-option');

  console.log('Waiting for confirm modal...');
  await page.waitForSelector('#pollModalConfirm', { state: 'visible', timeout: 5000 });

  console.log('Clicking "Yes, Lock It In"...');
  await page.click('#pollModalConfirm');

  console.log('Waiting for navigation (redirect)...');
  try {
    await page.waitForURL(url => !url.href.includes('mode=poll'), { timeout: 10000 });
    const finalUrl = page.url();
    console.log('Final URL after vote:', finalUrl);

    if (finalUrl.includes('locked_answer=') && !finalUrl.includes('mode=poll')) {
      console.log('✅ Test Passed: Redirected to explanation view correctly!');
    } else {
      console.error('❌ Test Failed: URL did not update as expected.');
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('❌ Test Failed: Timeout waiting for URL change.');
    console.error('Current URL is:', page.url());
    process.exitCode = 1;
  }

  console.log('Closing browser and server...');
  await browser.close();
  server.kill();
  process.exit();
})();
