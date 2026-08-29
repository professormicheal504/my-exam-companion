import re

with open('public/modules/rank/rank.html', 'r', encoding='utf-8') as f:
    content = f.read()

target = r"const { data, error } = await sb\.from\('exam_results'\).*?renderDynamicRank\(\);"

replacement = """const { data, error } = await sb.from('profiles')
        .select('global_points')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        globalPoints = data.global_points || 0;
      }

      renderDynamicRank();"""

content = re.sub(target, replacement, content, flags=re.DOTALL)

with open('public/modules/rank/rank.html', 'w', encoding='utf-8', newline='') as f:
    f.write(content)
