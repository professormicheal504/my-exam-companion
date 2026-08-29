import re

with open('public/components/supabase.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = r"if \(error\) \{ console\.error\('\[MEC Supabase\] saveExamResult:', error\.message\); return \{ saved: false, error: error\.message \}; \}"

replacement = target + """

    // Update global rank in profile
    try {
      const { data: resultsData } = await sb.from(TABLE_EXAM_RESULTS)
        .select('subjects')
        .eq('user_id', user.id);
      
      if (resultsData) {
        let globalPoints = 0;
        resultsData.forEach(r => {
          if (r.subjects && Array.isArray(r.subjects)) {
            r.subjects.forEach(s => globalPoints += (s.score || 0));
          }
        });
        
        let level = 1;
        const RANK_LEVELS = [0, 100, 300, 800, 1500, 2500, 4500, 7000, 10000, 15000, 25000, 40000, 65000, 100000, 1000000];
        for (let i = 0; i < RANK_LEVELS.length; i++) {
          if (globalPoints >= RANK_LEVELS[i]) level = i + 1;
          else break;
        }

        await sb.from('profiles').update({ 
          global_points: globalPoints, 
          rank_level: level 
        }).eq('id', user.id);
      }
    } catch (e) {
      console.error('[MEC Supabase] saveExamResult update profile rank error:', e);
    }
"""

content = re.sub(target, replacement, content)

with open('public/components/supabase.js', 'w', encoding='utf-8', newline='') as f:
    f.write(content)
