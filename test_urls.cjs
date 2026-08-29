const https = require('https');

function testUrl(url) {
  https.get(url, (res) => {
    console.log(`Status for ${url}: ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(`Error for ${url}: ${e.message}`);
  });
}

testUrl('https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev/ng/exams/university_entrance/jamb/accounts__principles_of_accounts/objective/2025.json');
testUrl('https://myexamcompanion.pages.dev/new_staging_area/ng/exams/university_entrance/jamb/accounts__principles_of_accounts/objective/2025.json');
