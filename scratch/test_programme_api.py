import requests
import json

try:
    res = requests.post('https://ibass-api.jamb.gov.ng/api/ibass/institution/programmes/1', json={})
    print(f"Status Code: {res.status_code}")
    data = res.json()
    if 'data' in data:
        print("\nFirst Programme:")
        print(json.dumps(data['data'][0] if isinstance(data['data'], list) and len(data['data']) > 0 else data['data'], indent=2)[:1000])
    else:
        print(json.dumps(data, indent=2)[:500])

except Exception as e:
    print(f"Error: {e}")
