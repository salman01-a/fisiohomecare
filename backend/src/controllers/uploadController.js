const { Storage } = require('@google-cloud/storage');
const path = require('path');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// Inisialisasi GCS Client
const storage = new Storage({
  keyFilename: path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json'),
});

// Ganti dengan nama bucket Firebase Storage / GCS kamu
// Secara default Firebase project bucket bernama: <project-id>.appspot.com
// Contoh project kamu: homecare-2b018.appspot.com
const bucketName = process.env.GCS_BUCKET_NAME || 'homecare-2b018.appspot.com';
const bucket = storage.bucket(bucketName);

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
      // Buat file menjadi public
      try {
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
        resolve(publicUrl);
      } catch (err) {
        // Jika gagal makePublic (biasanya karena Uniform Bucket-Level Access di GCP),
        // fallback pakai URL public default
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
        resolve(publicUrl);
      }
    });

    blobStream.end(file.buffer);
  });
};

/**
 * Upload file handler
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded');
    }

    const type = req.uploadType || 'documents';
    const publicUrl = await uploadToGCS(req.file, type);

    return ApiResponse.success(res, {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: publicUrl,
    }, 'File uploaded successfully to GCS');
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
    
    // Gunakan Promise.all untuk upload concurrent
    const uploadPromises = req.files.map(async (file) => {
      const publicUrl = await uploadToGCS(file, type);
      return {
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: publicUrl,
      };
    });

    const files = await Promise.all(uploadPromises);

    return ApiResponse.success(res, { files }, 'Files uploaded successfully to GCS');
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFile, uploadMultipleFiles };
