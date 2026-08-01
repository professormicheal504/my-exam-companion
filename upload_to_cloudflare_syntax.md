# STANDARD OPERATING PROCEDURE (SOP): UPLOADING NEW EXAMS TO CLOUDFLARE R2

Whenever you want to add a brand new exam to the platform (e.g., WAEC, NECO, GCSE, or a new University exam), follow this exact pathway to ensure it integrates perfectly with the "Million Dollar" Headless Architecture without breaking anything.

---

### STEP 1: Prepare the Raw Data
Place your raw/legacy JSON database files into your local `db` folder using a clean hierarchy.
For example, if you are adding Nigerian WAEC:
`C:\Users\Ojehomon Ohiozoeje\Documents\database\db\nigeria\exam\WAEC\WAEC Physics\2026.json`

### STEP 2: Convert to the Unified Schema
The platform UI ONLY understands the `unified_schema_v1`. You must NEVER upload legacy data directly to R2.
1. Duplicate or modify the `convert_to_unified_schema.py` script to point to your new raw folder.
2. Ensure the script outputs the files into your staging area with this exact naming convention:
   `r2_staging_area/content/exams/{country_code}_{exam_id}_{subject}_{year}.json`
   *(Example: `r2_staging_area/content/exams/ng_waec_physics_2026.json`)*
3. The script must also generate an index file for that exam (e.g., `ng_waec_index.json`).
4. Run the script: `python convert_to_unified_schema.py`

### STEP 3: Update the Country Config
Now that the converted files are sitting in the `r2_staging_area`, you need to tell the UI that this exam exists so it can show the button on the dashboard.
1. Open the specific country config in the staging area: `r2_staging_area/configs/ng.json` (Create it if it doesn't exist).
2. Add the new exam to the `dashboard_modules` array:
   ```json
   {
       "id": "ng_waec",
       "display_name": "WAEC Past Questions",
       "renderer": "cbt_engine",
       "icon": "📝",
       "data_source": "content/exams/ng_waec_index.json"
   }
   ```

### STEP 4: Sync to Cloudflare R2 Edge
Your staging area is now perfect. It's time to blast it to the global edge network.
1. Open your terminal.
2. Run the sync command: `python sync_to_r2.py`
3. The script will automatically scan the entire `r2_staging_area` and upload any new or modified files.
4. Because the script sets the `Cache-Control` headers automatically, the files will be cached on Cloudflare's edge immediately!

### SUMMARY PATHWAY
Raw DB -> `convert_to_unified_schema.py` -> `r2_staging_area/content/` -> Update `configs/` -> `sync_to_r2.py` -> LIVE!
