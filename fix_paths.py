import os
import re

# The root directory of your public folder
public_dir = r"c:\myproject\my_exam_companion\public"

# Regex patterns to find relative paths pointing to components
# This matches href="../components/..." or href="../../components/..." etc.
patterns = [
    (re.compile(r'href="\.\./[^"]*components/([^"]+)"'), r'href="/components/\1"'),
    (re.compile(r'src="\.\./[^"]*components/([^"]+)"'), r'src="/components/\1"'),
    (re.compile(r'data-base="\.\./[^"]*"'), r'data-base="/"'),
    (re.compile(r'data-base="\./"'), r'data-base="/"')
]

def fix_paths_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    for pattern, replacement in patterns:
        content = pattern.sub(replacement, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed paths in: {filepath}")

def main():
    print("Scanning for HTML files to fix paths...")
    count = 0
    fixed_count = 0
    for root, _, files in os.walk(public_dir):
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                for pattern, replacement in patterns:
                    content = pattern.sub(replacement, content)
                
                if content != original_content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Fixed paths in: {filepath}")
                    fixed_count += 1
                
                count += 1
                
    print(f"Done! Scanned {count} HTML files, fixed {fixed_count} files.")

if __name__ == "__main__":
    main()
