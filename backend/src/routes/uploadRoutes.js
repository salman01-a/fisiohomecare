const router = require('express').Router();
const { authenticate, authorize, requireValidatedTherapist } = require('../middleware/auth');
const { upload, setUploadType } = require('../middleware/upload');
const { uploadFile, uploadMultipleFiles, streamImage } = require('../controllers/uploadController');

router.use(authenticate);

// Upload dokumen lisensi terapis (STR)
router.post('/license', authorize('therapist'), setUploadType('licenses'), upload.single('file'), uploadFile);

// Upload bukti pembayaran
router.post('/payment', authorize('patient'), setUploadType('payments'), upload.single('file'), uploadFile);

// Upload foto kondisi (terapis harus sudah tervalidasi)
router.post('/photo', authorize('patient', 'therapist'), requireValidatedTherapist, setUploadType('photos'), upload.single('file'), uploadFile);

// Upload dokumen umum
router.post('/document', setUploadType('documents'), upload.single('file'), uploadFile);

// Upload multiple foto (max 5) — terapis harus tervalidasi
router.post('/photos', authorize('patient', 'therapist'), requireValidatedTherapist, setUploadType('photos'), upload.array('files', 5), uploadMultipleFiles);

// Stream/proxy image from GCS or local storage
router.get('/image', streamImage);

module.exports = router;
