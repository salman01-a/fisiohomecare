const path = require('path');
const fs = require('fs');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// Lazy-initialize GCS client
let bucket = null;
let gcsAvailable = false;

const initGCS = () => {
  if (bucket) return true;
  try {
    const { Storage } = require('@google-cloud/storage');
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json';
    const resolvedPath = path.resolve(serviceAccountPath);

    if (!fs.existsSync(resolvedPath)) {
      console.warn('⚠️  GCS: Service account file not found. Upload will use local storage fallback.');
      return false;
    }

    const storage = new Storage({ keyFilename: resolvedPath });
    const bucketName = process.env.GCS_BUCKET_NAME || 'homecare-2b018.appspot.com';
    bucket = storage.bucket(bucketName);
    gcsAvailable = true;
    console.log(`✅ GCS initialized with bucket: ${bucketName}`);
    return true;
  } catch (error) {
    console.warn('⚠️  GCS initialization failed:', error.message);
    console.warn('   Uploads will use local storage fallback.');
    return false;
  }
};

/**
 * Upload satu file ke GCS
 */
const uploadToGCS = (file, folder) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file provided'));

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const gcsFileName = `${folder}/${uniqueSuffix}${ext}`;
    
    const blob = bucket.file(gcsFileName);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    blobStream.on('error', (err) => {
      reject(err);
    });

    blobStream.on('finish', async () => {
      try {
        await blob.makePublic();
      } catch (err) {
        // Ignore if makePublic fails (Uniform Bucket-Level Access)
      }
      const bucketName = process.env.GCS_BUCKET_NAME || 'homecare-2b018.appspot.com';
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

/**
 * Upload satu file ke local storage (fallback saat GCS tidak tersedia)
 */
const uploadToLocal = async (file, folder) => {
  const uploadsDir = path.join(__dirname, '../../uploads', folder);
  
  // Buat folder jika belum ada
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname);
  const filename = `${uniqueSuffix}${ext}`;
  const filePath = path.join(uploadsDir, filename);

  fs.writeFileSync(filePath, file.buffer);

  // Return relative URL that can be served by express.static
  return `/uploads/${folder}/${filename}`;
};

/**
 * Upload file handler (GCS with local fallback)
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded');
    }

    const type = req.uploadType || 'documents';
    let fileUrl;

    // Try GCS first, fallback to local
    if (initGCS() && gcsAvailable) {
      fileUrl = await uploadToGCS(req.file, type);
    } else {
      fileUrl = await uploadToLocal(req.file, type);
    }

    return ApiResponse.success(res, {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl,
    }, 'File uploaded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload multiple files handler
 */
const uploadMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw ApiError.badRequest('No files uploaded');
    }

    const type = req.uploadType || 'documents';
    const useGCS = initGCS() && gcsAvailable;

    const uploadPromises = req.files.map(async (file) => {
      let fileUrl;
      if (useGCS) {
        fileUrl = await uploadToGCS(file, type);
      } else {
        fileUrl = await uploadToLocal(file, type);
      }
      return {
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: fileUrl,
      };
    });

    const files = await Promise.all(uploadPromises);

    return ApiResponse.success(res, { files, urls: files.map(f => f.url) }, 'Files uploaded successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFile, uploadMultipleFiles };
