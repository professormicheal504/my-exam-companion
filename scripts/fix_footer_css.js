import fs from 'fs';
import path from 'path';

const dir = 'public/modules/landing';
const OLD = '<link rel="stylesheet" href="../../components/sidebar.css?v=4">';
const NEW = `<link rel="stylesheet" href="../../components/sidebar.css?v=4">
  <link rel="stylesheet" href="../../components/footer.css">`;

fs.readdirSync(dir).filter(f => f.endsWith('.html')).forEach(f => {
  const fp = path.join(dir, f);
  let c = fs.readFileSync(fp, 'utf8');
  // Clean any previous bad injection (literal backtick-n)
  c = c.replace(/<link rel="stylesheet" href="\.\.\/\.\.\/components\/sidebar\.css\?v=4">`n\s*<link rel="stylesheet" href="\.\.\/\.\.\/components\/footer\.css">/g, OLD);
  // Now inject properly if not already present
  if (!c.includes('footer.css')) {
    c = c.replace(OLD, NEW);
    fs.writeFileSync(fp, c);
    console.log('✅ Fixed:', f);
  } else {
    // If there's a proper footer.css reference already, leave alone
    console.log('⏩ Already OK:', f);
  }
});
console.log('Done.');
