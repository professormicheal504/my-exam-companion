import requests
import json

try:
    res = requests.post('https://ibass-api.jamb.gov.ng/api/ibass/institution/programmes/', json={'inst_id': 1})
    data = res.json()
    print("Keys:", data.keys())
    
    if 'data' in data:
        items = data['data']
        if isinstance(items, dict) and 'data' in items:
            items = items['data']
            
        if len(items) > 0:
            print("\nFirst Programme Item Fields:")
            print(json.dumps(items[0], indent=2))
        else:
            print("No items found.")
            print(json.dumps(data, indent=2))
    else:
        print(json.dumps(data, indent=2))
        
except Exception as e:
    print(f"Error: {e}")
