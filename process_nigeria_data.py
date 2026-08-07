import os
import shutil
import glob
import json

def migrate_usa_data():
    print("Migrating USA data...")
    base_dir = r"c:\myproject\my_exam_companion\public\r2_staging_area\content\exams\usa"
    if not os.path.exists(base_dir):
        print(f"Directory not found: {base_dir}")
        return
        
    for exam_id in os.listdir(base_dir):
        exam_path = os.path.join(base_dir, exam_id)
        if not os.path.isdir(exam_path): continue
        for subject in os.listdir(exam_path):
            subject_path = os.path.join(exam_path, subject)
            if not os.path.isdir(subject_path): continue
            
            # Create 'objective' folder if it doesn't exist
            objective_path = os.path.join(subject_path, "objective")
            os.makedirs(objective_path, exist_ok=True)
            
            # Move all json files to 'objective'
            for file in glob.glob(os.path.join(subject_path, "*.json")):
                filename = os.path.basename(file)
                dest = os.path.join(objective_path, filename)
                shutil.move(file, dest)
                print(f"Moved {exam_id}/{subject}/{filename} to objective folder")

def format_name(name):
    # Ensure safe filenames by replacing spaces and hyphens with underscores
    return name.lower().replace(" ", "_").replace("-", "_").replace("__", "_")

def process_nigeria_data():
    print("Processing Nigeria Data...")
    src_dir = r"C:\Users\Ojehomon Ohiozoeje\Documents\database\db\nigeria\exam"
    dest_dir = r"c:\myproject\my_exam_companion\public\r2_staging_area\content\exams\nigeria"
    
    if not os.path.exists(src_dir):
        print(f"Directory not found: {src_dir}")
        return
        
    count = 0
    for exam_body in os.listdir(src_dir):
        body_path = os.path.join(src_dir, exam_body)
        if not os.path.isdir(body_path): continue
        
        for subject in os.listdir(body_path):
            subj_path = os.path.join(body_path, subject)
            if not os.path.isdir(subj_path): continue
            
            year_dir = os.path.join(subj_path, "year")
            if not os.path.isdir(year_dir): continue
            
            for exam_type in os.listdir(year_dir):
                type_path = os.path.join(year_dir, exam_type)
                if not os.path.isdir(type_path): continue
                
                # Format names for destination
                fmt_body = format_name(exam_body)
                fmt_subject = format_name(subject)
                fmt_type = format_name(exam_type)
                
                out_dir = os.path.join(dest_dir, fmt_body, fmt_subject, fmt_type)
                os.makedirs(out_dir, exist_ok=True)
                
                for file in glob.glob(os.path.join(type_path, "*.json")):
                    filename = os.path.basename(file)
                    dest_file = os.path.join(out_dir, filename)
                    shutil.copy2(file, dest_file)
                    count += 1
                    
    print(f"Successfully copied {count} Nigeria exam files!")

if __name__ == '__main__':
    migrate_usa_data()
    process_nigeria_data()
