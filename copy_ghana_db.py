import os
import shutil

src_dir = r"C:\Users\Ojehomon Ohiozoeje\Documents\database\db\ghana\exam\WASSCE for School Candidates\WAEC"
dest_base = r"C:\myproject\my_exam_companion\new_staging_area\gh\exams\high_school_graduate\waec"

def process_files():
    if not os.path.exists(src_dir):
        print(f"Source directory not found: {src_dir}")
        return

    copied_count = 0
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.json'):
                src_path = os.path.join(root, file)
                
                # Rel path: <Subject>\year\<Type>\<Year>.json
                rel_path = os.path.relpath(src_path, src_dir)
                parts = rel_path.split(os.sep)
                
                if len(parts) >= 4 and parts[1] == 'year':
                    subject = parts[0].lower().replace(' ', '_').replace('-', '_')
                    exam_type = parts[2].lower()
                    year = parts[3]
                    
                    dest_dir = os.path.join(dest_base, subject, exam_type)
                    os.makedirs(dest_dir, exist_ok=True)
                    
                    dest_path = os.path.join(dest_dir, year)
                    
                    # Read the file and parse it to make sure it's valid if needed, 
                    # but simple copy is faster.
                    shutil.copy2(src_path, dest_path)
                    copied_count += 1
                    
                else:
                    # In case the structure is different, e.g. <Subject>\<Type>\<Year>.json without 'year'
                    if len(parts) >= 3:
                        subject = parts[0].lower().replace(' ', '_').replace('-', '_')
                        exam_type = parts[1].lower()
                        year = parts[2]
                        
                        dest_dir = os.path.join(dest_base, subject, exam_type)
                        os.makedirs(dest_dir, exist_ok=True)
                        
                        dest_path = os.path.join(dest_dir, year)
                        shutil.copy2(src_path, dest_path)
                        copied_count += 1
                    else:
                        print(f"Skipped (unknown structure): {rel_path}")

    print(f"Successfully copied {copied_count} files to {dest_base}")

if __name__ == '__main__':
    process_files()
