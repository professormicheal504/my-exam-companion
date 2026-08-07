import re
import os

player_path = r"C:\myproject\my_exam_companion\public\modules\cbt_test\core\cbt_player.html"
instr_path = r"C:\myproject\my_exam_companion\public\modules\cbt_test\core\instruction.html"

# Fix cbt_player.html (replace Â· with •)
with open(player_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace any literal Â·
content = content.replace("Â·", "•")
# Also replace if it was somehow encoded differently
content = content.replace("Â", "")

with open(player_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed cbt_player.html")

# Fix instruction.html
with open(instr_path, "r", encoding="utf-8") as f:
    content = f.read()

# The script block to insert
new_script = """    <script>
      // Make instructions page dynamic based on URL params
      const params = new URLSearchParams(window.location.search);
      const uni = params.get('uni');
      const file = params.get('file');

      if (uni && file) {
          // University Course Logic
          const uniName = uni.replace(/_/g, ' ').toUpperCase();
          const courseCode = file.split('/').pop().replace('.json', '');
          
          document.querySelector('.instruction-banner h1').textContent = `${uniName} - ${courseCode} CBT Instructions`;
          
          const subjectsList = document.querySelector('.info-card__list');
          subjectsList.innerHTML = `<li>${courseCode}</li>`;
          
          const yearElements = document.querySelectorAll('.info-card__value');
          if (yearElements.length > 1) {
              yearElements[1].textContent = "N/A"; 
          }
          
          const instrTexts = document.querySelectorAll('.instruction-text');
          if (instrTexts.length > 0) {
              instrTexts[0].textContent = `This simulator gives you the exact experience you will encounter in the actual ${uniName} CBT platform for ${courseCode}.`;
          }
          
          const instrList1 = document.querySelectorAll('.instruction-list')[0];
          if (instrList1) instrList1.style.display = 'none'; 
      } else {
          // Standard Exam Logic
          const examId = params.get('exam_id') || 'Exam';
          const year = params.get('year') || '2025';
          const subjectParam = params.get('subject') || 'Subject';
          const subjectsArray = subjectParam.split(',').map(s => s.trim().replace(/_/g, ' '));
          
          const examName = examId.split('/').pop().toUpperCase();
          
          // Update Headers
          document.querySelector('.instruction-banner h1').textContent = `${examName} CBT Examination Instructions`;
          
          // Update Subjects List
          const subjectsList = document.querySelector('.info-card__list');
          if (subjectsList) {
              subjectsList.innerHTML = '';
              subjectsArray.forEach(subj => {
                  const li = document.createElement('li');
                  li.textContent = subj.replace(/\\b\\w/g, l => l.toUpperCase()); // title case
                  subjectsList.appendChild(li);
              });
          }
          
          // Update Year
          const yearElements = document.querySelectorAll('.info-card__value');
          if (yearElements.length > 1) {
              yearElements[1].textContent = year;
          }
          
          // Update specific text blocks
          const instrTexts = document.querySelectorAll('.instruction-text');
          if (instrTexts.length > 0) {
              instrTexts[0].textContent = `This simulator gives you the same experience you will encounter in the actual ${examName} CBT platform. You will be presented with questions from your selected subjects.`;
          }
          
          const instrList1 = document.querySelectorAll('.instruction-list')[0];
          if (instrList1) instrList1.style.display = 'none'; // Hide the specific question count list
      }
      
      // Ensure "Start Test" passes along the query string
      const startBtn = document.querySelector('.btn-start');
      if (startBtn) {
          startBtn.onclick = function() {
              window.location.href = 'cbt_player.html' + window.location.search;
          };
      }
    </script>
</body>
</html>"""

# We need to replace from the last <script> that has "Make instructions page dynamic" to the end of the file
pattern = r"<script>\s*// Make instructions page dynamic based on URL params.*?</script>\s*</body>\s*</html>"
if re.search(pattern, content, flags=re.DOTALL):
    content = re.sub(pattern, new_script, content, flags=re.DOTALL)
    with open(instr_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Fixed instruction.html (regex replaced)")
else:
    print("Regex failed to find script block in instruction.html")

