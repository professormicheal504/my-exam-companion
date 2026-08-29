import re

with open('public/modules/rank/rank.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_html = r'<div class="status-level">Level 4</div>\s*<div class="status-title">Apprentice Scholar</div>\s*<div class="status-desc">Keep learning! You are just a few challenges away from reaching Level 5.</div>'
new_html = '''<div class="status-level">Level 1</div>
              <div class="status-title">Novice</div>
              <div class="status-desc">Just starting out on the journey. Take exams to progress!</div>'''
content = re.sub(old_html, new_html, content)

with open('public/modules/rank/rank.html', 'w', encoding='utf-8', newline='') as f:
    f.write(content)
