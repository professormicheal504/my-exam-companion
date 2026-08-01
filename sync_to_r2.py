import os
import boto3
from botocore.exceptions import NoCredentialsError

# ==========================================
# CLOUDFLARE R2 CONFIGURATION
# ==========================================
# Replace these with your actual R2 credentials from the Cloudflare Dashboard
R2_ACCESS_KEY_ID = "d8ad742e1323a1c92fffc5faacf6033e"
R2_SECRET_ACCESS_KEY = "1e90a1557f265cc583c94d5fd5aa5f7a82af9c6d15f48b313a7b90cea0dcfd05"
R2_ENDPOINT_URL = "https://9b1a87526cb70ec5c728ba8761685a37.r2.cloudflarestorage.com"
R2_BUCKET_NAME = "my-exam-companion-data"

STAGING_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "r2_staging_area")

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto" # Cloudflare R2 uses 'auto'
    )

def sync_directory_to_r2():
    print(f"Starting sync from {STAGING_DIR} to bucket '{R2_BUCKET_NAME}'...")
    s3 = get_s3_client()
    
    upload_count = 0
    for root, dirs, files in os.walk(STAGING_DIR):
        for file in files:
            local_path = os.path.join(root, file)
            # Calculate the relative path for the S3 object key
            # e.g., r2_staging_area/configs/us.json -> configs/us.json
            s3_key = os.path.relpath(local_path, STAGING_DIR).replace("\\", "/")
            
            try:
                print(f"Uploading {s3_key}...")
                # The Cache-Control header tells Cloudflare's Edge to cache this file for 1 year (31536000 seconds).
                # 1 million students reading this will only result in 1 actual read operation on your R2 bill!
                s3.upload_file(
                    local_path, 
                    R2_BUCKET_NAME, 
                    s3_key,
                    ExtraArgs={
                        'CacheControl': 'public, max-age=31536000',
                        'ContentType': 'application/json' if s3_key.endswith('.json') else 'binary/octet-stream'
                    }
                )
                upload_count += 1
            except NoCredentialsError:
                print("ERROR: Invalid or missing R2 credentials. Please update the script variables.")
                return
            except Exception as e:
                print(f"Failed to upload {s3_key}: {e}")
                
    print(f"Sync complete! Uploaded {upload_count} files successfully.")

if __name__ == "__main__":
    if "YOUR_ACCESS_KEY_ID" in R2_ACCESS_KEY_ID:
        print("Please edit this script to include your Cloudflare R2 Access Keys before running.")
    else:
        sync_directory_to_r2()
