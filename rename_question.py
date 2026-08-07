import os

path = 'new_staging_area/ng/exams/university'
count = 0

for root, dirs, files in os.walk(path):
    for file in files:
        if file.endswith('.json'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            if '"question":' in content:
                content = content.replace('"question":', '"question_text":')
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                count += 1
                
print(f'Updated {count} files.')
