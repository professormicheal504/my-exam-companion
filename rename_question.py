import os
import json
import time
import requests
import threading
import concurrent.futures
from datetime import timedelta

# Your 3 API Keys
API_KEYS = [
    "XtpRXI95cfEXxFilxeMDiuJuTBblM0hu",
    "5A0QnckoIlEwhOzoqR6fJkRbVESPFRtm",
    "fotC38JjPy8uU1gkswk5YgzuW0DyBfA1"
]

API_URL = "https://api.mistral.ai/v1/chat/completions" 
MODEL_NAME = "mistral-small-latest" 
TARGET_DIR = r"C:\myproject\my_exam_companion\new_staging_area copy\ng\exams\university"

current_key_idx = 0
key_lock = threading.Lock()

# Global rate limiter state
rate_limit_lock = threading.Lock()
last_request_time = 0.0
MIN_DELAY = 3.0 # 3 seconds per request = 20 requests per minute

def wait_for_rate_limit():
    global last_request_time
    with rate_limit_lock:
        now = time.time()
        elapsed = now - last_request_time
        if elapsed < MIN_DELAY:
            time.sleep(MIN_DELAY - elapsed)
        last_request_time = time.time()

def get_next_key():
    global current_key_idx
    with key_lock:
        key = API_KEYS[current_key_idx]
        current_key_idx = (current_key_idx + 1) % len(API_KEYS)
        return key

def rewrite_with_llm(question_data):
    api_key = get_next_key()
    
    q_text = question_data.get("question_text", question_data.get("question", ""))
    options = question_data.get("options", [])
    explanation = question_data.get("explanation", "")
    
    system_prompt = (
        "You are an expert educational content formatter. "
        "Your task is to rewrite the provided question, options, and explanation using standard HTML tags. "
        "Rules:\n"
        "1. For 'question' and 'explanation': Wrap paragraphs in <p> tags, and bold key concepts with <b>.\n"
        "2. For 'options': Do NOT use <p> tags! ONLY use inline tags like <b>, <i>, or <sub>/<sup> if absolutely needed.\n"
        "3. Use <i> for emphasis where appropriate.\n"
        "4. YOU MUST PRESERVE the exact structure of the 'options' array. If you receive a list of objects, return a list of objects with ALL original keys intact (like 'option_id', 'tag', 'is_correct'), and ONLY modify the 'text' field. If it's a list of strings, just return a list of strings.\n"
        "5. ONLY return a valid JSON object with EXACTLY three keys: 'question', 'options', and 'explanation'.\n"
        "6. Do NOT include markdown code blocks (like ```json), just the raw JSON text."
    )
    
    user_content = json.dumps({
        "question": q_text,
        "options": options,
        "explanation": explanation
    })
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Rewrite this:\n{user_content}"}
        ],
        "temperature": 0.3
    }
    
    wait_for_rate_limit()
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 429:
            print("\nRate limited by provider. Sleeping for 15 seconds...")
            time.sleep(15)
            return rewrite_with_llm(question_data) 
            
        if response.status_code != 200:
            print(f"\nAPI Error {response.status_code}: {response.text}")
            return None
            
        result_text = response.json()['choices'][0]['message']['content'].strip()
        
        if result_text.startswith("```json"): result_text = result_text[7:]
        if result_text.startswith("```"): result_text = result_text[3:]
        if result_text.endswith("```"): result_text = result_text[:-3]
            
        result_json = json.loads(result_text.strip())
        
        question_data['question_text'] = result_json.get('question', q_text)
        if 'question' in question_data:
            question_data['question'] = result_json.get('question', q_text)
            
        question_data['options'] = result_json.get('options', options)
        question_data['explanation'] = result_json.get('explanation', explanation)
        
        # Mark as rewritten so we can resume if stopped!
        question_data['is_rewritten'] = True 
        
        return question_data
        
    except Exception as e:
        print(f"\nError calling LLM: {e}")
        return None

def count_total_unprocessed():
    total = 0
    file_paths = []
    
    for root, dirs, files in os.walk(TARGET_DIR):
        for file in files:
            if file.endswith('.json'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        questions = data if isinstance(data, list) else data.get("questions", [])
                        
                        unprocessed_in_file = sum(1 for q in questions if not q.get('is_rewritten', False))
                        if unprocessed_in_file > 0:
                            total += unprocessed_in_file
                            file_paths.append(path)
                except Exception:
                    pass
    return total, file_paths

def process_directory():
    print("Scanning directory to count pending questions...")
    total_to_process, target_files = count_total_unprocessed()
    
    if total_to_process == 0:
        print("All questions have already been rewritten! Nothing to do.")
        return
        
    print(f"Found {total_to_process} questions left to rewrite across {len(target_files)} files.")
    print("Starting concurrent processing with 3 workers (1 for each API key)...")
    
    processed_count = 0
    start_time = time.time()
    
    # Use 3 threads to utilize the 3 API keys concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        for file_path in target_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
                continue
            
            is_list = isinstance(data, list)
            questions = data if is_list else data.get("questions", [])
            
            if not questions:
                continue
                
            # Submit all unprocessed questions in this file to the executor
            futures = {}
            for idx, q in enumerate(questions):
                if not q.get('is_rewritten', False):
                    futures[executor.submit(rewrite_with_llm, q)] = idx
                    
            # Process them as they complete
            for future in concurrent.futures.as_completed(futures):
                idx = futures[future]
                updated_q = future.result()
                
                if updated_q:
                    questions[idx] = updated_q
                
                processed_count += 1
                
                # --- Progress and ETA Calculation ---
                elapsed_time = time.time() - start_time
                avg_time_per_q = elapsed_time / processed_count
                remaining_q = total_to_process - processed_count
                eta_seconds = remaining_q * avg_time_per_q
                eta_str = str(timedelta(seconds=int(eta_seconds)))
                
                print(f"\rProgress: ({processed_count}/{total_to_process}) | ETA: {eta_str} | Last File: {os.path.basename(file_path)}", end="", flush=True)
                
                # Save file immediately after EACH question finishes.
                # Because as_completed yields to the main thread, this write operation is strictly thread-safe!
                try:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        if is_list:
                            json.dump(questions, f, indent=4)
                        else:
                            data["questions"] = questions
                            json.dump(data, f, indent=4)
                except Exception as e:
                    print(f"\nError writing {file_path}: {e}")

    print(f"\n\nDone! Successfully completed {processed_count} questions.")

if __name__ == "__main__":
    if not os.path.exists(TARGET_DIR):
        print(f"Directory not found: {TARGET_DIR}")
    else:
        process_directory()
