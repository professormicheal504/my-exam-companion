import os
import json
import re
import asyncio
import aiohttp
from pathlib import Path

BASE_DIR = Path("new_staging_area/ng/brochure")
INSTITUTIONS_DIR = BASE_DIR / "institutions"
STATE_FILE = BASE_DIR / "scrape_state.json"
INSTITUTIONS_LIST_FILE = BASE_DIR / "institutions.json"

BASE_URL = "https://ibass-api.jamb.gov.ng/api/ibass"

# Ensure directories exist
INSTITUTIONS_DIR.mkdir(parents=True, exist_ok=True)

def load_state():
    if STATE_FILE.exists():
        with open(STATE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"completed_institutions": []}

def save_state(state):
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)

from html import unescape

def clean_html(html_str):
    if not html_str:
        return ""
    
    # Unescape weird custom entities and standard HTML entities
    html_str = html_str.replace("&dq;", '"').replace("&sq;", "'").replace("&#45;", "-")
    html_str = unescape(html_str)
    
    # Remove MS Word conditional comments (<!--[if gte mso...<![endif]-->)
    html_str = re.sub(r'<!--\[if gte mso.*?<!\[endif\]-->', '', html_str, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove standard comments
    html_str = re.sub(r'<!--.*?-->', '', html_str, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove <style> and <xml> blocks entirely
    html_str = re.sub(r'<style.*?>.*?</style>', '', html_str, flags=re.IGNORECASE | re.DOTALL)
    html_str = re.sub(r'<xml.*?>.*?</xml>', '', html_str, flags=re.IGNORECASE | re.DOTALL)
    
    # Strip all HTML tags EXCEPT <p>, <br>, <ul>, <li>, <strong>, <b>, <i>, <em>
    # A simple approach: remove ALL attributes from ALL tags
    html_str = re.sub(r'<([a-z0-9]+)\s+[^>]+>', r'<\1>', html_str, flags=re.IGNORECASE)
    
    # Also clean up empty tags like <p></p> or <span></span>
    html_str = re.sub(r'<([a-z0-9]+)>\s*</\1>', '', html_str, flags=re.IGNORECASE)
    html_str = re.sub(r'<o:p>\s*</o:p>', '', html_str, flags=re.IGNORECASE)
    
    # Strip leading/trailing whitespaces
    return html_str.strip()

async def fetch_institutions(session):
    # Try to load existing institutions list first to avoid re-fetching
    if INSTITUTIONS_LIST_FILE.exists():
        try:
            with open(INSTITUTIONS_LIST_FILE, "r", encoding="utf-8") as f:
                existing = json.load(f)
                if len(existing) > 100:  # Valid list found
                    print(f"Loaded {len(existing)} institutions from cache.")
                    return existing
        except:
            pass
            
    institutions = []
    page = 1
    while True:
        retries = 3
        success = False
        while retries > 0 and not success:
            try:
                print(f"Fetching institutions page {page}...")
                async with session.post(f"{BASE_URL}/institutions?page={page}", json={}) as res:
                    if res.status != 200:
                        retries = 0
                        break
                    data = await res.json()
                    items = data.get('data', [])
                    if isinstance(items, dict) and 'data' in items:
                        items = items['data']
                        
                    if not items:
                        retries = 0
                        break
                    
                    for item in items:
                        inst_type = item.get("inst_type")
                        program_type = "Unknown"
                        if inst_type == 4:
                            program_type = "Degree Awarding"
                        elif inst_type == 2:
                            program_type = "ND"
                        elif inst_type == 1:
                            program_type = "NCE"
                        elif inst_type == 3:
                            program_type = "NID"

                        institutions.append({
                            "id": item.get("id"),
                            "school_name": item.get("school_name") or item.get("title"),
                            "abbreviation": item.get("abbreviation"),
                            "state": item.get("state"),
                            "type": item.get("type"),
                            "program_type": program_type,
                            "mode_of_study": item.get("mode_of_study"),
                            "ownership": item.get("ownership"),
                            "accreditation": item.get("accreditation"),
                            "address": item.get("address"),
                        })
                    success = True
            except Exception as e:
                print(f"Error fetching institutions page {page}: {e}. Retrying...")
                retries -= 1
                await asyncio.sleep(2)
                
        if not success:
            break
        page += 1
            
    # Save the global list only if we got a good amount
    if len(institutions) > 0:
        with open(INSTITUTIONS_LIST_FILE, "w", encoding="utf-8") as f:
            json.dump(institutions, f, indent=2)
    return institutions

async def fetch_programmes_for_institution(session, inst, state):
    inst_id = inst["id"]
    if inst_id in state["completed_institutions"]:
        return
        
    print(f"Fetching programmes for institution {inst_id} ({inst['abbreviation']})...")
    
    programmes = []
    page = 1
    while True:
        retries = 3
        success = False
        while retries > 0 and not success:
            try:
                async with session.post(f"{BASE_URL}/institution/programmes/{inst_id}?page={page}", json={}) as res:
                    if res.status != 200:
                        retries = 0
                        break
                    data = await res.json()
                    items = data.get('data', [])
                    if isinstance(items, dict) and 'data' in items:
                        items = items['data']
                        
                    if not items:
                        retries = 0
                        break
                    
                    for item in items:
                        programmes.append({
                            "id": item.get("id"),
                            "course_name": item.get("title"),
                            "department": item.get("department"),
                            "status": item.get("status"),
                            "utme_requirements": clean_html(item.get("utme_requirements")),
                            "de_requirements": clean_html(item.get("de_requirements")),
                            "subjects": clean_html(item.get("subjects")),
                            "special_remarks": clean_html(item.get("details"))
                        })
                    success = True
            except Exception as e:
                print(f"Error fetching programmes for inst {inst_id} page {page}: {e}. Retrying...")
                retries -= 1
                await asyncio.sleep(2)
                
        if not success:
            break
        page += 1
            
    # Save the programmes to inst_id.json
    inst_file = INSTITUTIONS_DIR / f"{inst_id}.json"
    
    # Store the school details alongside the courses so the frontend doesn't need to join
    output_data = {
        "institution": inst,
        "programmes": programmes
    }
    
    with open(inst_file, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)
        
    state["completed_institutions"].append(inst_id)
    save_state(state)

async def main():
    state = load_state()
    
    async with aiohttp.ClientSession() as session:
        # 1. Fetch all institutions
        institutions = await fetch_institutions(session)
        print(f"Found {len(institutions)} total institutions.")
        
        # 2. Fetch programmes for each institution concurrently (with limit)
        # Reduced from 10 to 3 to prevent server disconnections on their side
        semaphore = asyncio.Semaphore(3)
        
        async def bounded_fetch(inst):
            async with semaphore:
                await fetch_programmes_for_institution(session, inst, state)
                
        tasks = [bounded_fetch(inst) for inst in institutions]
        
        # Run in batches to avoid overwhelming the server entirely, although semaphore handles it
        await asyncio.gather(*tasks)
        
    print("\nExtraction Complete! All data saved.")

if __name__ == "__main__":
    # Use default event loop, no need to set WindowsSelectorEventLoopPolicy which triggers warnings in newer Python
    asyncio.run(main())
