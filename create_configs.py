import os
import json

base_dir = r"C:\myproject\my_exam_companion\new_staging_area\configs"
os.makedirs(base_dir, exist_ok=True)

# 1. Global Countries
global_countries = {
    "us": { "name": "United States", "currency": "$", "flag_url": "/assets/flags/us.svg" },
    "ng": { "name": "Nigeria", "currency": "₦", "flag_url": "/assets/flags/ng.svg" }
}

with open(os.path.join(base_dir, "global_countries.json"), "w", encoding="utf-8") as f:
    json.dump(global_countries, f, indent=4)

# 2. US Config
us_config = {
    "country_code": "us",
    "dashboard_modules": [
        {
            "id": "usa/sat",
            "display_name": "SAT Prep",
            "renderer": "cbt_engine",
            "icon": "🎓",
            "data_source": "us/exams/university_entrance/sat/index.json"
        }
    ]
}

with open(os.path.join(base_dir, "us.json"), "w", encoding="utf-8") as f:
    json.dump(us_config, f, indent=4)

# 3. NG Config
ng_config = {
    "country_code": "ng",
    "dashboard_modules": [
        {
            "id": "nigeria/jamb",
            "display_name": "JAMB CBT",
            "renderer": "cbt_engine",
            "icon": "📝",
            "data_source": "ng/exams/university_entrance/jamb/index.json"
        },
        {
            "id": "nigeria/waec",
            "display_name": "WAEC SSCE",
            "renderer": "cbt_engine",
            "icon": "🏫",
            "data_source": "ng/exams/high_school_graduate/waec/index.json"
        },
        {
            "id": "nigeria/neco",
            "display_name": "NECO",
            "renderer": "cbt_engine",
            "icon": "🏢",
            "data_source": "ng/exams/high_school_graduate/neco/index.json"
        }
    ]
}

with open(os.path.join(base_dir, "ng.json"), "w", encoding="utf-8") as f:
    json.dump(ng_config, f, indent=4)

print("Configs generated successfully.")
