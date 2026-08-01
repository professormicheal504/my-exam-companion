import os
import json
import glob
import re

SOURCE_DIR = r"C:\Users\Ojehomon Ohiozoeje\Documents\database\db\usa\exam\SAT"
TARGET_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "r2_staging_area", "content", "exams")
os.makedirs(TARGET_DIR, exist_ok=True)

# Generate an index file for SAT
sat_index = {
    "exam_id": "us_sat",
    "display_name": "SAT",
    "subjects": []
}

subject_folders = [d for d in os.listdir(SOURCE_DIR) if os.path.isdir(os.path.join(SOURCE_DIR, d))]

for subject in subject_folders:
    subject_id = re.sub(r'[^a-zA-Z0-9]', '_', subject.lower())
    
    subject_obj = {
        "id": f"us_sat_{subject_id}",
        "name": subject,
        "years": []
    }
    
    subject_path = os.path.join(SOURCE_DIR, subject)
    year_files = glob.glob(os.path.join(subject_path, "*.json"))
    
    for yf in year_files:
        year = os.path.basename(yf).replace('.json', '')
        subject_obj["years"].append(year)
        
        # Read the legacy JSON
        with open(yf, 'r', encoding='utf-8') as f:
            try:
                legacy_data = json.load(f)
            except json.JSONDecodeError:
                print(f"Failed to parse {yf}")
                continue
                
        unified_questions = []
        for key, q in legacy_data.items():
            # Handle options
            unified_options = []
            correct_id = None
            if "options" in q and q["options"]:
                for idx, opt in enumerate(q["options"]):
                    if isinstance(opt, dict):
                        tag = opt.get("tag", "").upper()
                        if not tag: tag = str(idx)
                        unified_options.append({
                            "id": tag,
                            "text": opt.get("text", "")
                        })
                        if opt.get("is_correct"):
                            correct_id = tag
                    elif isinstance(opt, str):
                        tag = chr(65 + idx) # A, B, C, D
                        unified_options.append({
                            "id": tag,
                            "text": opt
                        })
                        # Cannot easily determine correct answer if it's just a string, but let's prevent crash
                        
            unified_q = {
                "question_id": f"us_sat_{subject_id}_{year}_{q.get('order_id', key)}",
                "content_type": "multiple_choice" if unified_options else "short_answer",
                "question_text": q.get("question_text", ""),
                "media_url": q.get("question_image"),
                "options": unified_options,
                "correct_option_id": correct_id,
                "deep_analysis": {
                    "explanation": q.get("explanation", ""),
                    "topic_tags": [q.get("topic")] if q.get("topic") else []
                }
            }
            unified_questions.append(unified_q)
            
        # Save unified JSON
        out_filename = f"us_sat_{subject_id}_{year}.json"
        with open(os.path.join(TARGET_DIR, out_filename), 'w', encoding='utf-8') as out_f:
            json.dump(unified_questions, out_f, indent=4)
            
        print(f"Converted {subject} {year} -> {out_filename}")
        
    subject_obj["years"].sort(reverse=True)
    sat_index["subjects"].append(subject_obj)

# Save the SAT index
with open(os.path.join(TARGET_DIR, "us_sat_index.json"), "w", encoding="utf-8") as f:
    json.dump(sat_index, f, indent=4)

print("SAT Conversion Complete!")
