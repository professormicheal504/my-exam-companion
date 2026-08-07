import os
import json
import re

def sanitize_filename(name):
    return re.sub(r'[\\/*?:"<>|]', '_', name)

base_path = 'new_staging_area/ng/exams/university'

for root, dirs, files in os.walk(base_path):
    for f in files:
        if f == 'chapter.json':
            file_path = os.path.join(root, f)
            print(f"Processing {file_path}")
            
            with open(file_path, 'r', encoding='utf-8') as file:
                try:
                    questions = json.load(file)
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
                    continue
            
            # The folder containing 'chapters' is the course_code folder
            chapters_dir = root
            course_dir = os.path.dirname(chapters_dir)
            
            for q in questions:
                topic = q.get('topic', 'Uncategorized')
                safe_topic = sanitize_filename(topic)
                
                order_id = q.get('order_id', q.get('question_id', 'unknown'))
                safe_id = sanitize_filename(str(order_id))
                
                topic_dir = os.path.join(course_dir, safe_topic)
                os.makedirs(topic_dir, exist_ok=True)
                
                out_file = os.path.join(topic_dir, f"{safe_id}.json")
                with open(out_file, 'w', encoding='utf-8') as out_f:
                    # Save as a list containing one question, or just the question object?
                    # The prompt says 'topic -> id.json', usually it means just the object
                    # but CBT engine might expect an array. We will save it as an array to be safe,
                    # or just the object. Let's save as an array of 1.
                    json.dump([q], out_f, indent=4)
                    
            print(f"Finished splitting {file_path}")
            # Optionally remove the original chapter.json
            os.remove(file_path)
            # Try removing the chapters directory if empty
            try:
                os.rmdir(chapters_dir)
            except OSError:
                pass
