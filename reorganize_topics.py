import os
import json
import shutil

base_path = 'new_staging_area/ng/exams/university'

for root, dirs, files in os.walk(base_path, topdown=False):
    # If the directory has json files and no subdirectories, it's likely a topic folder
    json_files = [f for f in files if f.endswith('.json') and f != 'index.json']
    if len(json_files) > 0 and len(dirs) == 0:
        topic_name = os.path.basename(root)
        course_dir = os.path.dirname(root)
        
        # Don't process if it's already a consolidated folder that somehow matches this
        # In our case, the files inside are things like "25.json"
        
        all_questions = []
        for jf in json_files:
            file_path = os.path.join(root, jf)
            with open(file_path, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    if isinstance(data, list):
                        all_questions.extend(data)
                    else:
                        all_questions.append(data)
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
                    
        # Sort questions by the number in filename if possible
        def get_sort_key(filename):
            name = filename.replace('.json', '')
            try:
                return int(name)
            except ValueError:
                return 999999
                
        # Actually it's better to sort all_questions directly by order_id if it exists
        def sort_by_order_id(q):
            order = q.get('order_id', q.get('question_id', '999999'))
            try:
                return int(order)
            except ValueError:
                return 999999
                
        all_questions.sort(key=sort_by_order_id)
        
        if all_questions:
            out_file = os.path.join(course_dir, f"{topic_name}.json")
            print(f"Creating {out_file} with {len(all_questions)} questions")
            with open(out_file, 'w', encoding='utf-8') as f:
                json.dump(all_questions, f, indent=4)
                
            # Clean up topic folder
            for jf in json_files:
                os.remove(os.path.join(root, jf))
            try:
                os.rmdir(root)
            except OSError as e:
                print(f"Could not remove directory {root}: {e}")
