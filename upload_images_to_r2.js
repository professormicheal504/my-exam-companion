const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// ==========================================
// Cloudflare R2 Configuration
// ==========================================
// Replace these with your actual Cloudflare R2 credentials
const ACCOUNT_ID = 'd048d28d4cd54d579def4bf758d5a298'; // from your pub-... url
const ACCESS_KEY_ID = 'YOUR_R2_ACCESS_KEY_ID';
const SECRET_ACCESS_KEY = 'YOUR_R2_SECRET_ACCESS_KEY';
const BUCKET_NAME = 'YOUR_BUCKET_NAME'; 

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

const IMAGES_DIR = 'C:\\Users\\Ojehomon Ohiozoeje\\Documents\\database\\db\\nigeria\\exam_image';

async function getFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  }));
  return Array.prototype.concat(...files);
}

const mimeTypes = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

async function uploadToR2() {
  console.log(`Scanning for images in ${IMAGES_DIR}...`);
  const files = await getFiles(IMAGES_DIR);
  const imageFiles = files.filter(f => Object.keys(mimeTypes).includes(path.extname(f).toLowerCase()));
  
  console.log(`Found ${imageFiles.length} images to upload.`);

  let uploaded = 0;
  let failed = 0;

  for (const file of imageFiles) {
    // Convert local absolute path to relative R2 path
    // e.g., C:\...\db\nigeria\exam_image\question_image\... -> nigeria/exam_image/question_image/...
    const relativePath = file.substring(file.indexOf('nigeria\\exam_image')).replace(/\\/g, '/');
    const ext = path.extname(file).toLowerCase();
    
    try {
      const fileStream = fs.createReadStream(file);
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: relativePath,
        Body: fileStream,
        ContentType: mimeTypes[ext] || 'application/octet-stream',
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      uploaded++;
      console.log(`[${uploaded}/${imageFiles.length}] Uploaded: ${relativePath}`);
    } catch (err) {
      failed++;
      console.error(`Failed to upload ${relativePath}:`, err.message);
    }
  }

  console.log(`\nUpload Complete!`);
  console.log(`Successfully uploaded: ${uploaded}`);
  console.log(`Failed: ${failed}`);
}

uploadToR2().catch(console.error);
