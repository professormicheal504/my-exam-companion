import os
import time
import boto3
import mimetypes
from botocore.exceptions import NoCredentialsError, ClientError

# ==========================================
# CLOUDFLARE R2 CONFIGURATION
# ==========================================
R2_ACCESS_KEY_ID = "d8ad742e1323a1c92fffc5faacf6033e"
R2_SECRET_ACCESS_KEY = "1e90a1557f265cc583c94d5fd5aa5f7a82af9c6d15f48b313a7b90cea0dcfd05"
R2_ENDPOINT_URL = "https://9b1a87526cb70ec5c728ba8761685a37.r2.cloudflarestorage.com"
R2_BUCKET_NAME = "my-exam-companion-data"

IMAGES_DIR = r"C:\Users\Ojehomon Ohiozoeje\Documents\database\db\nigeria\exam_image"

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT_URL,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        region_name="auto" # Cloudflare R2 uses 'auto'
    )

def get_existing_keys(s3, bucket_name, prefix="nigeria/exam_image"):
    print(f"Fetching existing uploaded files from R2 (prefix '{prefix}') to resume if needed...")
    existing_keys = set()
    paginator = s3.get_paginator('list_objects_v2')
    try:
        pages = paginator.paginate(Bucket=bucket_name, Prefix=prefix)
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    existing_keys.add(obj['Key'])
        print(f"Found {len(existing_keys)} existing files in R2. They will be skipped.")
    except ClientError as e:
        print(f"Error listing objects (will upload all): {e}")
    return existing_keys

def upload_images_to_r2():
    print(f"Scanning for images in {IMAGES_DIR}...")
    s3 = get_s3_client()
    
    if not os.path.exists(IMAGES_DIR):
        print(f"Directory not found: {IMAGES_DIR}")
        return

    # Valid image extensions
    valid_exts = {'.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'}
    all_local_images = []
    
    for root, dirs, files in os.walk(IMAGES_DIR):
        for file in files:
            if os.path.splitext(file)[1].lower() in valid_exts:
                all_local_images.append(os.path.join(root, file))
                
    print(f"Found {len(all_local_images)} images locally.")

    # Get already uploaded keys to skip them
    existing_keys = get_existing_keys(s3, R2_BUCKET_NAME)

    pending_uploads = []
    for local_path in all_local_images:
        # Convert local absolute path to relative R2 path
        start_idx = local_path.find(r"nigeria\exam_image")
        if start_idx == -1:
            start_idx = local_path.find("nigeria/exam_image")
            
        if start_idx != -1:
            s3_key = local_path[start_idx:].replace("\\", "/")
        else:
            # Fallback path logic
            s3_key = os.path.relpath(local_path, IMAGES_DIR).replace("\\", "/")
            s3_key = f"nigeria/exam_image/{s3_key}"

        if s3_key not in existing_keys:
            pending_uploads.append((local_path, s3_key))

    total_to_upload = len(pending_uploads)
    print(f"Images left to upload: {total_to_upload}")

    if total_to_upload == 0:
        print("All images are already uploaded! Nothing to do.")
        return

    uploaded = 0
    failed = 0
    start_time = time.time()

    for local_path, s3_key in pending_uploads:
        # Guess content type
        content_type, _ = mimetypes.guess_type(local_path)
        if not content_type:
            content_type = 'application/octet-stream'

        try:
            # Added CacheControl for "one read for many users" (cache at Cloudflare Edge)
            s3.upload_file(
                local_path, 
                R2_BUCKET_NAME, 
                s3_key,
                ExtraArgs={
                    'CacheControl': 'public, max-age=31536000',
                    'ContentType': content_type
                }
            )
            uploaded += 1
            
            # Calculate ETA
            elapsed_time = time.time() - start_time
            avg_time_per_file = elapsed_time / uploaded
            files_left = total_to_upload - uploaded
            eta_seconds = files_left * avg_time_per_file
            
            # Format ETA
            if eta_seconds > 3600:
                eta_str = time.strftime('%Hh %Mm %Ss', time.gmtime(eta_seconds))
            else:
                eta_str = time.strftime('%Mm %Ss', time.gmtime(eta_seconds))
                
            print(f"({uploaded}/{total_to_upload}) Uploaded: {s3_key} | ETA: {eta_str}")
            
        except NoCredentialsError:
            print("ERROR: Invalid or missing R2 credentials.")
            return
        except Exception as e:
            failed += 1
            print(f"Failed to upload {s3_key}: {e}")

    print("\nUpload Complete!")
    print(f"Successfully uploaded this session: {uploaded}")
    print(f"Failed: {failed}")

if __name__ == "__main__":
    upload_images_to_r2()
