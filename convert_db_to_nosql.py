import sqlite3
import json
import os
import uuid
import re

def slugify(value):
    if not value: return "unknown"
    value = str(value).lower().strip()
    value = re.sub(r'[^a-z0-9]+', '_', value)
    return value.strip('_')

def get_semester_folder(sem):
    sem = str(sem).lower().strip()
    if '1' in sem or 'first' in sem: return "1st_semester"
    if '2' in sem or 'second' in sem: return "2nd_semester"
    return f"{slugify(sem)}_semester" if sem else "unknown_semester"

def get_level_folder(lvl):
    if not lvl: return "unknown_level"
    lvl_str = str(lvl).strip().lower().replace("level", "").strip()
    return f"{lvl_str}_level" if lvl_str else "unknown_level"

def main():
    db_path = r'C:\myproject\uniprep\exam_prep_questions.db'
    base_dir = r'C:\myproject\my_exam_companion\new_staging_area\ng\exams\university'
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    
    cur.execute("SELECT * FROM exam_prep_questions")
    rows = cur.fetchall()
    
    # Group by institution, faculty, department, level, semester, course_code
    grouped = {}
    
    for row in rows:
        inst = slugify(row['institution'])
        fac = slugify(row['faculty'])
        dept = slugify(row['department'])
        sem = get_semester_folder(row['semester'])
        lvl_folder = get_level_folder(row['level'])
        cc = row['course_code'].upper().strip() if row['course_code'] else "UNKNOWN"
        
        # path_key now includes level
        path_key = os.path.join(base_dir, inst, fac, dept, lvl_folder, sem)
        
        if path_key not in grouped:
            grouped[path_key] = {}
            
        if cc not in grouped[path_key]:
            grouped[path_key][cc] = []
            
        # Format options
        options = []
        correct_ans = str(row['correct_answer']).lower().strip()
        
        for tag in ['a', 'b', 'c', 'd']:
            opt_text = row[f'option_{tag}']
            if opt_text:
                options.append({
                    "option_id": str(uuid.uuid4().int)[:6],
                    "tag": tag,
                    "text": opt_text,
                    "is_correct": correct_ans == tag
                })
        
        level_val = row['level'] if row['level'] else ""
        exam_type = f"{level_val} level CBT".strip()
        
        q_obj = {
            "order_id": row['order_id'],
            "exam_type": exam_type,
            "topic": row['topic'],
            "course_code": row['course_code'],
            "course_title": row['course_title'],
            "question_type": "CBT",
            "question": row['question'],
            "explanation": row['explanation'],
            "options": options,
            # store meta for index generation
            "_meta_faculty": row['faculty'],
            "_meta_dept": row['department'],
            "_meta_level": row['level'],
            "_meta_semester": sem.replace('_semester', ''),
            "_meta_inst": inst
        }
        
        grouped[path_key][cc].append(q_obj)
        
    
    # Dictionary to hold index data for each institution
    indexes = {}
    
    for path_key, courses in grouped.items():
        os.makedirs(path_key, exist_ok=True)
        for cc, questions in courses.items():
            
            def sort_key(x):
                try:
                    return float(x['order_id'])
                except:
                    return float('inf')
            questions.sort(key=sort_key)
            
            # Extract meta from the first question
            meta = {}
            if questions:
                meta = {
                    "faculty": questions[0].get("_meta_faculty") or "Unknown",
                    "dept": questions[0].get("_meta_dept") or "Unknown",
                    "level": questions[0].get("_meta_level") or "Unknown",
                    "semester": questions[0].get("_meta_semester") or "Unknown",
                    "course_title": questions[0].get("course_title") or cc,
                    "inst": questions[0].get("_meta_inst")
                }
            
            # Remove meta from questions before saving and add question_number
            for i, q in enumerate(questions, start=1):
                q['question_number'] = i
                q.pop("_meta_faculty", None)
                q.pop("_meta_dept", None)
                q.pop("_meta_level", None)
                q.pop("_meta_semester", None)
                q.pop("_meta_inst", None)
            
            file_path = os.path.join(path_key, f"{cc}.json")
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(questions, f, indent=4, ensure_ascii=False)
            
            # Populate index data
            inst_key = meta.get("inst")
            if inst_key:
                if inst_key not in indexes:
                    indexes[inst_key] = []
                
                # Calculate relative path from the institution's root folder
                inst_root = os.path.join(base_dir, inst_key)
                rel_path = os.path.relpath(file_path, inst_root).replace('\\', '/')
                
                indexes[inst_key].append({
                    "code": cc,
                    "name": meta["course_title"],
                    "faculty": meta["faculty"].title(),
                    "dept": meta["dept"].title(),
                    "level": meta["level"],
                    "semester": "1" if "1st" in meta["semester"] else "2" if "2nd" in meta["semester"] else meta["semester"],
                    "format": "CBT",
                    "questions": len(questions),
                    "file_path": rel_path
                })
                
    # Save index.json for each institution
    for inst_key, courses_list in indexes.items():
        inst_root = os.path.join(base_dir, inst_key)
        index_path = os.path.join(inst_root, "index.json")
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump(courses_list, f, indent=4, ensure_ascii=False)
                
    print("Conversion complete.")

if __name__ == '__main__':
    main()
