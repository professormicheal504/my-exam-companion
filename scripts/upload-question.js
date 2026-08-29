const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error('Usage: node scripts/upload-question.js <path-to-json-file>');
  process.exit(1);
}

const filePath = path.resolve(args[0]);

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

try {
  const content = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(content);
  
  if (!json.id) {
    console.error('Error: JSON file must contain an "id" field.');
    process.exit(1);
  }

  const id = json.id;
  console.log(`Uploading ${id} to R2 bucket 'exam-questions'...`);

  const cmd = `npx wrangler r2 object put exam-questions/questions/${id}.json --file="${filePath}"`;
  console.log(`Running: ${cmd}`);
  
  execSync(cmd, { stdio: 'inherit' });
  
  console.log(`✅ Successfully uploaded ${id}.json!`);
} catch (err) {
  console.error('Error uploading question:', err.message);
  process.exit(1);
}
