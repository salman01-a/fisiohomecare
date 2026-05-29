const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Gunakan memory storage agar file tidak disimpan di lokal,
// melainkan di RAM sementara sebelum di-upload ke GCS.
const storage = multer.memoryStorage();

// Filter file yang dibolehkan
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'File type not allowed. Only JPG, PNG, and PDF are accepted.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Max 10MB
  },
});

// Middleware helper: set upload type sebelum multer
const setUploadType = (type) => (req, res, next) => {
  req.uploadType = type;
  next();
};

module.exports = { upload, setUploadType };
