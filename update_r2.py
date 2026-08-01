import os
import boto3
from botocore.exceptions import NoCredentialsError

# ==========================================
# CLOUDFLARE R2 CONFIGURATION
# ==========================================
R2_ACCESS_KEY_ID = "d8ad742e1323a1c92fffc5faacf6033e"
R2_SECRET_ACCESS_KEY = "1e90a1557f265cc583c94d5fd5aa5f7a82af9c6d15f48b313a7b90cea0dcfd05"
R2_ENDPOINT_URL = "https://9b1a87526cb70ec5c728ba8761685a37.r2.cloudflarestorage.com"
R2_BUCKET_NAME = "my-exam-companion-data"

# Ensure we use the exact public staging area
STAGING_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public", "r2_staging_area")

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto"
    )

def remove_old_flat_files():
    print(f"Connecting to R2 bucket '{R2_BUCKET_NAME}' to remove old flat files...")
    s3 = get_s3_client()
    
    try:
        prefix = 'content/exams/us_sat_'
        
        paginator = s3.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=R2_BUCKET_NAME, Prefix=prefix)
        
        objects_to_delete = []
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    objects_to_delete.append({'Key': obj['Key']})
                    
        if objects_to_delete:
            print(f"Found {len(objects_to_delete)} old files to delete.")
            for i in range(0, len(objects_to_delete), 1000):
                batch = objects_to_delete[i:i+1000]
                s3.delete_objects(
                    Bucket=R2_BUCKET_NAME,
                    Delete={'Objects': batch}
                )
            print(f"Successfully deleted {len(objects_to_delete)} old flat files from R2.")
        else:
            print("No old flat files found to delete on R2.")
            
    except NoCredentialsError:
        print("ERROR: Invalid or missing R2 credentials.")
    except Exception as e:
        print(f"Failed to remove old files: {e}")

def sync_directory_to_r2():
    print(f"\nStarting sync from {STAGING_DIR} to bucket '{R2_BUCKET_NAME}'...")
    s3 = get_s3_client()
    
    upload_count = 0
    for root, dirs, files in os.walk(STAGING_DIR):
        for file in files:
            local_path = os.path.join(root, file)
            s3_key = os.path.relpath(local_path, STAGING_DIR).replace("\\", "/")
            
            try:
                print(f"Uploading {s3_key}...")
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
                print("ERROR: Invalid or missing R2 credentials.")
                return
            except Exception as e:
                print(f"Failed to upload {s3_key}: {e}")
                
    print(f"Sync complete! Uploaded {upload_count} files successfully to R2.")

if __name__ == "__main__":
    remove_old_flat_files()
    sync_directory_to_r2()
