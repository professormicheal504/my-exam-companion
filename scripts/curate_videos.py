import os
import json
import re
from pathlib import Path
import yt_dlp

SYLLABUS_DIR = Path("new_staging_area/ng/syllabus/jamb/subjects")
VIDEOS_DIR = Path("new_staging_area/ng/syllabus/jamb/videos")

VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

PREFERRED_CHANNELS = '"The Organic Chemistry Tutor" OR "CrashCourse" OR "Professor Dave Explains" OR "Amoeba Sisters" OR "Khan Academy" OR "Bozeman Science"'

def extract_topics(content):
    if "DETAILED SYLLABUS" in content:
        content = content.split("DETAILED SYLLABUS")[1]
    
    topics = []
    # Extract bold texts starting with a number
    raw_topics = re.findall(r'<strong>\s*(\d+\.\s*.*?)\s*</strong>', content)
    for t in raw_topics:
        # Remove the leading number and dot
        t = re.sub(r'^\d+\.\s*', '', t)
        t = t.strip(' :;.,')
        # Clean up any HTML entities left
        t = t.replace('&#45;', '-')
        if len(t) > 3 and t not in topics:
            topics.append(t)
            
    # Fallback for subjects like English and Yoruba that use <li> lists instead of numbered bold tags
    if not topics:
        list_items = re.findall(r'<li>(.*?)</li>', content)
        for t in list_items:
            t = t.strip(' :;.,')
            t = t.replace('&#45;', '-')
            if len(t) > 3 and t not in topics and not t.startswith('pp '):
                topics.append(t)

    return topics

def search_youtube(query, num_results=1):
    try:
        # Prepend ytsearch exactly as required by yt-dlp to force youtube search extractor
        search_str = f"ytsearch{num_results}:{query}"
        ydl_opts = {
            'extract_flat': True,
            'quiet': True,
            'no_warnings': True,
            'ignoreerrors': True
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(search_str, download=False)
            if info and 'entries' in info:
                return [{'id': e['id'], 'title': e['title'], 'channel': e.get('channel')} for e in info['entries']]
    except Exception as e:
        safe_query = query.encode('ascii', 'replace').decode()
        print(f"Error searching {safe_query}: {e}")
    return []

def main():
    if not SYLLABUS_DIR.exists():
        print("Syllabus directory not found!")
        return

    for file_path in SYLLABUS_DIR.glob("*.json"):
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        subject_id = data.get("id")
        subject_name = data.get("name")
        
        if not subject_id:
            continue
            
        out_file = VIDEOS_DIR / f"{subject_id}_videos.json"
        
        # Load existing progress if any
        curated = {}
        if out_file.exists():
            with open(out_file, "r", encoding="utf-8") as f:
                curated = json.load(f)
                
        topics = extract_topics(data.get("content", ""))
        print(f"\nProcessing {subject_name} ({len(topics)} topics)")
        
        new_updates = False
        for idx, topic in enumerate(topics):
            topic_key = topic
            
            safe_topic = topic.encode('ascii', 'replace').decode()
            if topic_key in curated and len(curated[topic_key]) > 0:
                print(f"  [{idx+1}/{len(topics)}] Skipped (already fetched): {safe_topic}")
                continue
                
            # Make the query more robust and prevent yt-dlp from parsing colons as URLs
            search_query = f'{topic} {subject_name} tutorial ({PREFERRED_CHANNELS})'.replace(':', ' ')
            print(f"  [{idx+1}/{len(topics)}] Searching: {safe_topic}...")
            
            videos = search_youtube(search_query, num_results=4)
            curated[topic_key] = videos
            new_updates = True
            
            # Save after each topic to not lose progress
            with open(out_file, "w", encoding="utf-8") as f:
                json.dump(curated, f, indent=2)

        if new_updates:
            print(f"  Saved {out_file}")
        else:
            print(f"  Already up to date.")

if __name__ == "__main__":
    main()
