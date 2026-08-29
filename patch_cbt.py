import sys

path = 'public/modules/cbt_test/core/cbt_player.html'
with open(path, 'r', encoding='utf-8') as f:
    data = f.read()

target = """      const R2_BASE_URL = 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';

      try {
        let allQuestions = [];
        // fetchedSubjects keyed by original index to preserve order after Promise.all
        let fetchedSubjectsMap = {};

        const activeCountry = localStorage.getItem('mec_country') || 'ng';"""

replacement = """      const R2_BASE_URL = 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';
      const mode = params.get('mode');

      try {
        let allQuestions = [];
        let fetchedSubjectsMap = {};
        const activeCountry = localStorage.getItem('mec_country') || 'ng';

        if (mode === 'mock') {
            const mockUrl = `/api/generate_mock?subjects=${encodeURIComponent(subjectStr)}`;
            try {
                let res = await fetch(mockUrl);
                if (!res.ok) throw new Error("Mock API Failed");
                let mockData = await res.json();
                
                subjects.forEach((subj, idx) => {
                    let subjQs = mockData.filter(q => q.subject_id === subj);
                    if (subjQs.length > 0) {
                        fetchedSubjectsMap[idx] = {
                            id: subj,
                            name: subj.replace(/_/g, ' ').toUpperCase(),
                            rawQuestions: subjQs
                        };
                    }
                });
            } catch (e) {
                console.error("Failed to load mock exam from Vercel API", e);
            }
        }"""

target2 = """        await Promise.all(subjects.map(async (subj, subjOriginalIndex) => {"""
replacement2 = """        if (mode !== 'mock') await Promise.all(subjects.map(async (subj, subjOriginalIndex) => {"""

if target in data and target2 in data:
    data = data.replace(target, replacement)
    data = data.replace(target2, replacement2)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(data)
    print("Success")
else:
    print("Target not found")
    if target not in data:
        print("target 1 not found")
    if target2 not in data:
        print("target 2 not found")
