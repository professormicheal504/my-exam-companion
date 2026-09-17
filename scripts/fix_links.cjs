const fs = require('fs');
const glob = require('glob');

glob.sync('public/modules/landing/*.html').forEach(f => {
  let text = fs.readFileSync(f, 'utf8');
  text = text.replace(/href="\/modules\/index\.html"/g, 'href="/"');
  fs.writeFileSync(f, text);
});
console.log('Fixed landing pages.');
