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
/**
 * Stream/proxy an image from GCS or local storage
 * GET /upload/image?url=<encoded_url>
 */
const streamImage = async (req, res, next) => {
  try {
    let fileUrl = req.query.url;
    if (!fileUrl) {
      throw ApiError.badRequest('Missing "url" query parameter');
    }

    // If it's a local file
    if (fileUrl.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '../../', fileUrl);
      if (!fs.existsSync(localPath)) {
        throw ApiError.notFound('Local image file not found');
      }
      return res.sendFile(localPath);
    }

    // If it's a GCS URL, stream from bucket
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const { getBucket } = require('../config/firebase');
      const bucket = getBucket();
      if (!bucket) {
        // Fallback: try to redirect to the URL directly
        return res.redirect(fileUrl);
      }

      // Extract GCS path from URL
      try {
        const urlObj = new URL(fileUrl);
        const bucketName = process.env.GCS_BUCKET_NAME || 'homecare-2b018.appspot.com';
        const prefix = `/${bucketName}/`;
        if (urlObj.pathname.startsWith(prefix)) {
          fileUrl = decodeURIComponent(urlObj.pathname.substring(prefix.length));
        } else {
          const parts = urlObj.pathname.split('/o/');
          if (parts.length > 1) {
            fileUrl = decodeURIComponent(parts[1].split('?')[0]);
          } else {
            fileUrl = decodeURIComponent(urlObj.pathname.split('/').slice(2).join('/'));
          }
        }
      } catch (e) {
        console.warn('Failed to parse GCS URL:', fileUrl);
      }

      const file = bucket.file(fileUrl);
      const [exists] = await file.exists();
      if (!exists) {
        throw ApiError.notFound('Image file not found in storage bucket');
      }

      const [metadata] = await file.getMetadata();
      res.setHeader('Content-Type', metadata.contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      file.createReadStream()
        .on('error', () => next(ApiError.internal('Error streaming image')))
        .pipe(res);
    } else {
      throw ApiError.badRequest('Invalid image URL');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadFile, uploadMultipleFiles, streamImage };
