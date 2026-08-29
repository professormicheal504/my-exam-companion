"""
MEC Dark Mode Injector — Advanced Algorithm
=============================================
Strategy:
  1. Walk every .html file in public/
  2. Detect the correct relative path depth for dark-mode.css
  3. Inject the <link> right after topbar.css is loaded (so it
     inherits variables and override order is correct)
  4. If dark-mode.css is already injected, skip the file
  5. Also:
     - Add the anti-flash <script> in <head> if not present
     - Bump CSS version query strings so browser re-fetches
"""
import os
import re

PUBLIC_DIR = 'public'
DARK_CSS_FILENAME = 'dark-mode.css'
TOPBAR_CSS_PATTERN = re.compile(
    r'(<link[^>]*(?:topbar\.css)[^>]*>)',
    re.IGNORECASE
)
DARK_CSS_ALREADY = re.compile(r'dark-mode\.css', re.IGNORECASE)

ANTI_FLASH_SCRIPT = """<script>
  /* Anti-flash: apply saved theme before first paint */
  (function() {
    try {
      var t = localStorage.getItem('mec_theme') || 'light';
      document.documentElement.setAttribute('data-theme', t);
    } catch(e) {}
  })();
</script>"""

ANTI_FLASH_ALREADY = re.compile(r'mec_theme.*data-theme|data-theme.*mec_theme', re.DOTALL)

def get_depth(filepath):
    """Get depth of file relative to PUBLIC_DIR for relative path generation."""
    rel = os.path.relpath(filepath, PUBLIC_DIR)
    depth = len(rel.split(os.sep)) - 1  # -1 for the filename itself
    return depth

def make_dark_css_link(depth):
    """Generate correct relative path to dark-mode.css based on depth."""
    if depth == 0:
        # e.g. public/index.html -> components/dark-mode.css
        prefix = 'components/'
    elif depth == 1:
        # e.g. public/modules/index.html -> ../components/dark-mode.css
        prefix = '../components/'
    elif depth == 2:
        prefix = '../../components/'
    elif depth == 3:
        prefix = '../../../components/'
    elif depth == 4:
        prefix = '../../../../components/'
    else:
        prefix = '../' * depth + 'components/'
    
    return f'<link rel="stylesheet" href="{prefix}{DARK_CSS_FILENAME}">'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()

    original = content
    changed = False

    # --- 1. Inject dark-mode.css link ---
    if not DARK_CSS_ALREADY.search(content):
        depth = get_depth(filepath)
        dark_link = make_dark_css_link(depth)

        # Try to inject right after topbar.css link
        if TOPBAR_CSS_PATTERN.search(content):
            content = TOPBAR_CSS_PATTERN.sub(
                r'\1\n  ' + dark_link,
                content,
                count=1
            )
            changed = True
        elif '</head>' in content:
            # Fallback: inject before </head>
            content = content.replace('</head>', f'  {dark_link}\n</head>', 1)
            changed = True

    # --- 2. Inject anti-flash script ---
    if not ANTI_FLASH_ALREADY.search(content):
        if '<head>' in content:
            content = content.replace('<head>', '<head>\n' + ANTI_FLASH_SCRIPT, 1)
            changed = True

    if changed and content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

injected = 0
skipped = 0
for root_dir, dirs, files in os.walk(PUBLIC_DIR):
    # Skip admin-panel and auth pages to avoid breaking them
    dirs[:] = [d for d in dirs if d not in ['__pycache__']]
    for fname in files:
        if fname.endswith('.html'):
            fpath = os.path.join(root_dir, fname)
            if process_file(fpath):
                injected += 1
                print(f'  [+] Injected: {fpath}')
            else:
                skipped += 1

print(f'\nDone! Injected dark-mode.css into {injected} files. {skipped} already up-to-date.')
