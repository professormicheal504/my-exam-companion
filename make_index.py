import os
import re

# Read original
with open('public/modules/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace module links first - basically any href="./something" that is a local module link
content = re.sub(r'href="\.\/(.*?)"', r'href="./modules/\1"', content)

# Replace component and asset paths
content = content.replace('href="../components/', 'href="./components/')
content = content.replace('src="../components/', 'src="./components/')
content = content.replace('href="../assets/', 'href="./assets/')
content = content.replace('src="../assets/', 'src="./assets/')


# Write to public/index.html
with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Generated public/index.html")
