import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Backgrounds
    content = re.sub(r'background:\s*(?:white|#fff|#ffffff|#FFF|#FFFFFF)\b', 'background: var(--bg-card)', content)
    content = re.sub(r'background-color:\s*(?:white|#fff|#ffffff|#FFF|#FFFFFF)\b', 'background-color: var(--bg-card)', content)
    content = re.sub(r'background:\s*(?:#f7f7f8|#f3f4f6|#f9fafb)\b', 'background: var(--bg-base)', content)
    content = re.sub(r'background-color:\s*(?:#f7f7f8|#f3f4f6|#f9fafb)\b', 'background-color: var(--bg-base)', content)

    # 2. Text Colors
    content = re.sub(r'color:\s*(?:#131212|#111827|#1f2937|#000|#000000)\b', 'color: var(--text-primary)', content)
    content = re.sub(r'color:\s*(?:#4b5563|#6b7280|#9ca3af)\b', 'color: var(--text-muted)', content)

    # 3. Borders
    content = re.sub(r'border-color:\s*(?:#f0f0f0|#e5e7eb|#eaeaea|#f5f5f5|#ddd|#dddddd)\b', 'border-color: var(--border)', content)
    content = re.sub(r'border:\s*1px\s*solid\s*(?:#f0f0f0|#e5e7eb|#eaeaea|#f5f5f5|#ddd|#dddddd)\b', 'border: 1px solid var(--border)', content)
    content = re.sub(r'border-bottom:\s*1px\s*solid\s*(?:#f0f0f0|#e5e7eb|#eaeaea|#f5f5f5|#ddd|#dddddd)\b', 'border-bottom: 1px solid var(--border)', content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

changed_files = 0
for root, dirs, files in os.walk('public'):
    for file in files:
        if file.endswith('.html') or file.endswith('.css'):
            if process_file(os.path.join(root, file)):
                changed_files += 1

print(f"✅ Successfully updated {changed_files} files with theme variables!")
