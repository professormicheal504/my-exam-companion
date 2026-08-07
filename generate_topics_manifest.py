import os
import json

base_path = 'new_staging_area/ng/exams/university'

topics_created = 0

for root, dirs, files in os.walk(base_path):
    # A course directory is one that contains at least one topic json file (excluding index.json)
    json_files = [f for f in files if f.endswith('.json') and f != 'index.json' and f != 'topics.json']
    
    if len(json_files) > 0:
        # We found a course directory containing topic JSON files
        topics = []
        for jf in json_files:
            topic_name = jf.replace('.json', '')
            topics.append(topic_name)
            
        topics.sort()
        
        topics_file = os.path.join(root, 'topics.json')
        with open(topics_file, 'w', encoding='utf-8') as f:
            json.dump(topics, f, indent=4)
            
        topics_created += 1
        print(f"Created topics.json in {root} with {len(topics)} topics")

print(f"Finished generating {topics_created} topics.json manifests.")
