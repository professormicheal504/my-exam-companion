import os
import json

BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "r2_staging_area", "configs")
os.makedirs(BASE_DIR, exist_ok=True)

# 1. Global Countries Index
global_countries = {
    "us": { "name": "United States", "currency": "$", "flag_url": "/assets/flags/us.svg" },
    "ng": { "name": "Nigeria", "currency": "₦", "flag_url": "/assets/flags/ng.svg" }
}

with open(os.path.join(BASE_DIR, "global_countries.json"), "w", encoding="utf-8") as f:
    json.dump(global_countries, f, indent=4)

# 2. US Modules Config (SAT focus for now)
us_config = {
    "country_code": "us",
    "dashboard_modules": [
        {
            "id": "us_sat",
            "display_name": "SAT Prep",
            "renderer": "cbt_engine",
            "icon": "🎓",
            "data_source": "content/exams/us_sat_index.json"
        }
    ]
}

with open(os.path.join(BASE_DIR, "us.json"), "w", encoding="utf-8") as f:
    json.dump(us_config, f, indent=4)

print(f"Generated configs in {BASE_DIR}")
