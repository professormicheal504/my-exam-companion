import os
import json

base_dir = r"c:\myproject\my_exam_companion\public\r2_staging_area\content\exams"

for country in os.listdir(base_dir):
    country_path = os.path.join(base_dir, country)
    if not os.path.isdir(country_path): continue
    
    for exam in os.listdir(country_path):
        exam_path = os.path.join(country_path, exam)
        if not os.path.isdir(exam_path): continue
        
        index_path = os.path.join(exam_path, "index.json")
        
        # Build config
        exam_id = f"{country}/{exam}"
        display_name = exam.upper()
        
        subjects = []
        for subj in os.listdir(exam_path):
            subj_path = os.path.join(exam_path, subj)
            if not os.path.isdir(subj_path): continue
            
            # Read years from objective folder (default for CBT)
            obj_path = os.path.join(subj_path, "objective")
            years = []
            if os.path.exists(obj_path):
                for f in os.listdir(obj_path):
                    if f.endswith(".json"):
                        years.append(f.replace(".json", ""))
                        
            # sort years descending
            years.sort(reverse=True)
            
            subjects.append({
                "id": subj,
                "name": subj.replace("_", " ").title(),
                "years": years
            })
            
        config = {
            "exam_id": exam_id,
            "display_name": display_name,
            "subjects": subjects
        }
        
        with open(index_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=4)
        print(f"Generated index.json for {exam_id}")
