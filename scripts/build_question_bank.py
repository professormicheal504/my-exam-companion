import os
import json
import glob
from pathlib import Path

# Configuration
SOURCE_DIR = r"C:\Users\Ojehomon Ohiozoeje\Documents\database\db\nigeria\exam"
DEST_DIR = r"C:\myproject\my_exam_companion\public\data\questions\ng"

def clean_string(s):
    if not s:
        return ""
    # Make safe for directory names
    return s.strip().lower().replace(" ", "_").replace("(", "").replace(")", "").replace("-", "_")

def process_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return

    if not data:
        return

    # Extract metadata from the first question to understand context
    first_q_key = list(data.keys())[0]
    first_q = data[first_q_key]

    exam_type = clean_string(first_q.get("exam_type", "unknown"))
    subject = clean_string(first_q.get("subject", "unknown"))
    exam_year = clean_string(str(first_q.get("exam_year", "unknown")))

    if exam_type == "unknown" or subject == "unknown":
        print(f"Skipping {file_path} - unknown exam or subject")
        return

    # Create destination directory
    out_dir = os.path.join(DEST_DIR, exam_type, subject)
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, f"{exam_year}.json")

    # Build new schema
    formatted_questions = []
    
    # Sort keys by order_id if available, otherwise just use natural order
    q_items = list(data.items())
    try:
        q_items.sort(key=lambda x: x[1].get('order_id', 9999))
    except:
        pass

    for q_id, q_data in q_items:
        # Build options
        new_options = []
        for opt in q_data.get("options", []):
            new_options.append({
                "id": opt.get("tag", "").lower(),
                "text": opt.get("text", ""),
                "is_correct": opt.get("is_correct", False)
            })

        formatted_q = {
            "id": str(q_id),
            "text": q_data.get("question_text", ""),
            "topic": q_data.get("topic", ""),
            "image_url": q_data.get("question_image"),
            "answer_image": q_data.get("answer_image"),
            "options": new_options,
            "explanation": q_data.get("explanation"),
            "reference_passage": q_data.get("reference_passage")
        }
        formatted_questions.append(formatted_q)

    final_payload = {
        "metadata": {
            "country": "ng",
            "exam": exam_type,
            "subject": subject,
            "year": exam_year,
            "total_questions": len(formatted_questions)
        },
        "questions": formatted_questions
    }

    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(final_payload, f, ensure_ascii=False, indent=2)
    
    print(f"Processed: {exam_type}/{subject}/{exam_year}.json ({len(formatted_questions)} questions)")

def main():
    print(f"Scanning source directory: {SOURCE_DIR}")
    
    json_files = []
    for root, dirs, files in os.walk(SOURCE_DIR):
        for file in files:
            if file.endswith(".json"):
                json_files.append(os.path.join(root, file))
    
    print(f"Found {len(json_files)} JSON files. Processing...")
    
    count = 0
    for file_path in json_files:
        # We only want to process Objective files for now, or just process all.
        if "Objective" in file_path or "Practical" in file_path or "Theory" in file_path:
             process_file(file_path)
             count += 1
             
    print(f"\nDone! Successfully processed {count} exam files.")
    print(f"Output saved to: {DEST_DIR}")

if __name__ == "__main__":
    main()
