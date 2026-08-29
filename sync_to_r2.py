import os
import boto3
from botocore.exceptions import NoCredentialsError
import concurrent.futures

# ==========================================
# CLOUDFLARE R2 CONFIGURATION
# ==========================================
# Replace these with your actual R2 credentials from the Cloudflare Dashboard
R2_ACCESS_KEY_ID = "d8ad742e1323a1c92fffc5faacf6033e"
R2_SECRET_ACCESS_KEY = "1e90a1557f265cc583c94d5fd5aa5f7a82af9c6d15f48b313a7b90cea0dcfd05"
R2_ENDPOINT_URL = "https://9b1a87526cb70ec5c728ba8761685a37.r2.cloudflarestorage.com"
R2_BUCKET_NAME = "my-exam-companion-data"

STAGING_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "new_staging_area")

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto" # Cloudflare R2 uses 'auto'
    )

def upload_single_file(local_path, s3_key, s3):
    try:
        s3.upload_file(
            local_path, 
            R2_BUCKET_NAME, 
            s3_key,
            ExtraArgs={
                'CacheControl': 'public, max-age=31536000',
                'ContentType': 'application/json' if s3_key.endswith('.json') else 'binary/octet-stream'
            }
        )
        return True
    except NoCredentialsError:
        print("ERROR: Invalid or missing R2 credentials.")
        return False
    except Exception as e:
        print(f"Failed to upload {s3_key}: {e}")
        return False

def sync_directory_to_r2():
    print(f"Starting intelligent sync from {STAGING_DIR} to bucket '{R2_BUCKET_NAME}'...")
    s3 = get_s3_client()
    
    print("Fetching current bucket inventory (this takes a few seconds)...")
    r2_inventory = {}
    try:
        paginator = s3.get_paginator('list_objects_v2')
        for page in paginator.paginate(Bucket=R2_BUCKET_NAME):
            if 'Contents' in page:
                for obj in page['Contents']:
                    r2_inventory[obj['Key']] = obj['Size']
    except Exception as e:
        print(f"Failed to fetch inventory: {e}. Will upload all files.")

    # Collect all files first
    files_to_upload = []
    skipped_count = 0
    for root, dirs, files in os.walk(STAGING_DIR):
        for file in files:
            local_path = os.path.join(root, file)
            s3_key = os.path.relpath(local_path, STAGING_DIR).replace("\\", "/")
            
            # Check if file exists in R2 and size matches exactly
            local_size = os.path.getsize(local_path)
            if s3_key in r2_inventory and r2_inventory[s3_key] == local_size:
                skipped_count += 1
            else:
                files_to_upload.append((local_path, s3_key))
            
    print(f"Skipped {skipped_count} unmodified files.")
    print(f"Found {len(files_to_upload)} new or modified files. Uploading with 50 threads...")
    
    if len(files_to_upload) == 0:
        print("Everything is up to date!")
        return
        
    upload_count = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
        # Submit all tasks
        futures = {executor.submit(upload_single_file, path, key, s3): key for path, key in files_to_upload}
        
        # Process results as they complete
        for i, future in enumerate(concurrent.futures.as_completed(futures), 1):
            if future.result():
                upload_count += 1
            if i % 500 == 0:
                print(f"Progress: {i}/{len(files_to_upload)} files uploaded...")

    print(f"Sync complete! Uploaded {upload_count} files successfully.")

if __name__ == "__main__":
    if "YOUR_ACCESS_KEY_ID" in R2_ACCESS_KEY_ID:
        print("Please edit this script to include your Cloudflare R2 Access Keys before running.")
    else:
        sync_directory_to_r2()
