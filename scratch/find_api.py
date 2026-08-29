import requests
import re

try:
    js_content = requests.get('https://ibass.jamb.gov.ng/static/js/main.7e8073ea.js').text
    paths = re.findall(r'"([^"]*ibass/institution/programme[^"]*)"', js_content)
    paths2 = re.findall(r'"([^"]*brochure[^"]*)"', js_content)
    paths3 = re.findall(r'"([^"]*api/[^"]*)"', js_content)
    
    print('Programme paths:')
    for p in set(paths): print(p)
    
    print('\nBrochure paths:')
    for p in set(paths2): print(p)
    
    print('\nAPI paths:')
    for p in set(paths3): print(p)
        
except Exception as e:
    print(f"Error: {e}")
