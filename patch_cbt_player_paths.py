import re

file_path = r'c:\myproject\my_exam_companion\public\modules\cbt_test\core\cbt_player.html'

with open(file_path, 'r', encoding='latin-1') as f:
    content = f.read()

# 1. Update the exam_id mapping and remove `content/exams/` prefix
# Original:
#       const subjects = subjectStr.split(',');
#
#       // TODO: Replace with your actual Cloudflare R2 Public URL
#       const R2_BASE_URL = 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';
#
#       const reviewTopic = params.get('reviewTopic');

insertion = """      const subjects = subjectStr.split(',');

      // Map old exam IDs to new paths
      const examPathMap = {
        'usa/sat': 'us/exams/university_entrance/sat',
        'nigeria/jamb': 'ng/exams/university_entrance/jamb',
        'nigeria/waec': 'ng/exams/high_school_graduate/waec',
        'nigeria/neco': 'ng/exams/high_school_graduate/neco',
        'nigeria/post_utme': 'ng/exams/university_entrance/post_utme'
      };
      const mappedExamPath = examPathMap[examId] || examId;

      // TODO: Replace with your actual Cloudflare R2 Public URL
      const R2_BASE_URL = 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';

      const reviewTopic = params.get('reviewTopic');"""

content = content.replace(
    "      const subjects = subjectStr.split(',');\n\n      // TODO: Replace with your actual Cloudflare R2 Public URL\n      const R2_BASE_URL = 'https://pub-d048d28d4cd54d579def4bf758d5a298.r2.dev';\n\n      const reviewTopic = params.get('reviewTopic');",
    insertion
)

# 2. Update `indexContentPath`
# Original:
#         const indexContentPath = `content/exams/${examId}/index.json`;
content = content.replace(
    "const indexContentPath = `content/exams/${examId}/index.json`;",
    "const indexContentPath = `${mappedExamPath}/index.json`;"
)

# 3. Update `filePath` and `contentPath`
# Original:
#          const filePath = `${examId}/${subj}/${examType}/${yearToUse}.json`;
#          const contentPath = `content/exams/${filePath}`;
content = content.replace(
    "const filePath = `${examId}/${subj}/${examType}/${yearToUse}.json`;\n          const contentPath = `content/exams/${filePath}`;",
    "const filePath = `${mappedExamPath}/${subj}/${examType}/${yearToUse}.json`;\n          const contentPath = filePath;"
)

# Replace the strange characters for cleanliness and write back as utf-8
content = content.replace('', '-')
content = content.replace('', 'x')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Path mapping patch applied.")
