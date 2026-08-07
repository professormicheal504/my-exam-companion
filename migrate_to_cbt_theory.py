import os
import json
import shutil
import glob
import re

# Paths
UNI_DIR = r"new_staging_area\ng\exams\university\southern_delta_university_sdu"
THEORY_SRC = r"C:\myproject\cbt_image\edited_theory_question"

# 1. Process Theory Images
print("--- Processing Theory Images ---")
theory_target_base = os.path.join(UNI_DIR, "computing", "software_engineering", "300_level", "2nd_semester")
os.makedirs(theory_target_base, exist_ok=True)

if os.path.exists(THEORY_SRC):
    for filename in os.listdir(THEORY_SRC):
        if filename.endswith(".png"):
            # Extract course code from something like "computing_software_engineering_csc_328.png"
            # Using regex to find 3 letters followed by optional underscore/space and numbers
            match = re.search(r'([a-z]{3})_?(\d{3})', filename, re.IGNORECASE)
            if match:
                course_code = f"{match.group(1).upper()} {match.group(2)}"
            else:
                # Fallback if no match
                course_code = filename.replace('.png', '').upper()
                
            course_dir = os.path.join(theory_target_base, course_code)
            theory_dir = os.path.join(course_dir, "theory")
            os.makedirs(theory_dir, exist_ok=True)
            
            # Copy image
            src_path = os.path.join(THEORY_SRC, filename)
            dst_path = os.path.join(theory_dir, filename)
            shutil.copy2(src_path, dst_path)
            
            # Update manifest
            manifest_path = os.path.join(theory_dir, "manifest.json")
            manifest = []
            if os.path.exists(manifest_path):
                with open(manifest_path, 'r', encoding='utf-8') as f:
                    manifest = json.load(f)
                    
            if filename not in manifest:
                manifest.append(filename)
                
            with open(manifest_path, 'w', encoding='utf-8') as f:
                json.dump(manifest, f, indent=4)
                
            print(f"Copied {filename} to {course_code}/theory")
else:
    print(f"Source folder not found: {THEORY_SRC}")

# 2. Migrate CBT JSON files
print("\n--- Migrating CBT JSON Files ---")
for root, dirs, files in os.walk(UNI_DIR):
    # Skip if we are already inside a cbt or theory folder
    if os.path.basename(root) in ['cbt', 'theory']:
        continue
        
    json_files = [f for f in files if f.endswith('.json') and f not in ['index.json', 'topics.json']]
    
    if json_files:
        cbt_dir = os.path.join(root, "cbt")
        os.makedirs(cbt_dir, exist_ok=True)
        
        # Move all topic json files
        for jf in json_files:
            shutil.move(os.path.join(root, jf), os.path.join(cbt_dir, jf))
            
        # Move topics.json if exists
        if 'topics.json' in files:
            shutil.move(os.path.join(root, 'topics.json'), os.path.join(cbt_dir, 'topics.json'))
            
        print(f"Moved {len(json_files)} JSON files to {os.path.basename(root)}/cbt")

# 3. Rebuild index.json
print("\n--- Rebuilding index.json ---")
index_path = os.path.join(UNI_DIR, "index.json")
courses = []

for root, dirs, files in os.walk(UNI_DIR):
    # Only process leaf course folders (they contain cbt or theory dirs)
    if 'cbt' in dirs or 'theory' in dirs:
        # Build path relative to UNI_DIR
        rel_path = os.path.relpath(root, UNI_DIR).replace('\\', '/')
        parts = rel_path.split('/')
        
        if len(parts) >= 5:
            faculty = parts[0]
            dept = parts[1]
            level = parts[2].replace('_', ' ').title()
            semester = parts[3].replace('_', ' ').title()
            course_code = parts[4]
            
            formats = []
            if 'cbt' in dirs:
                formats.append("CBT")
            if 'theory' in dirs:
                formats.append("Theory")
                
            # Default mock questions count
            questions_count = 500 if "CBT" in formats else 0
            if "CBT" in formats:
                cbt_dir = os.path.join(root, "cbt")
                # Count actual questions if possible, or just default
                pass
                
            course_entry = {
                "faculty": faculty.title(),
                "dept": dept.title(),
                "level": level,
                "semester": semester.split()[0], # e.g. "2nd"
                "code": course_code,
                "name": course_code + " - " + "Course Title", # Mock title
                "format": "CBT" if formats == ["CBT"] else ("Theory" if formats == ["Theory"] else "CBT & Theory"),
                "formats": formats,
                "questions": questions_count,
                "file_path": rel_path + ".json" # Keep .json for backwards compatibility in UI until fixed
            }
            courses.append(course_entry)

# Sort courses
courses.sort(key=lambda x: (x['level'], x['semester'], x['code']))

with open(index_path, 'w', encoding='utf-8') as f:
    json.dump(courses, f, indent=4)

print(f"Rebuilt index.json with {len(courses)} courses.")
