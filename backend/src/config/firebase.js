const admin = require('firebase-admin');
const { getFirestore: getFirestoreAdmin } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage'); // TAMBAHKAN INI
const path = require('path');

let firebaseApp;
let firestoreDb;
let storageBucket; // TAMBAHKAN INI

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json';

    // Pastikan Anda menambahkan FIREBASE_STORAGE_BUCKET di file .env Anda
    // Contoh isi .env: FIREBASE_STORAGE_BUCKET=homecare-2b018.appspot.com
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

    if (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: bucketName // TAMBAHKAN INI
      });
    } else {
      const serviceAccount = require(path.resolve(serviceAccountPath));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: bucketName // TAMBAHKAN INI
      });
    }

    // Inisialisasi Firestore... (kode Anda sebelumnya)
    const dbId = process.env.FIRESTORE_DATABASE_ID;
    if (dbId) {
      firestoreDb = getFirestoreAdmin(firebaseApp, dbId);
    } else {
      firestoreDb = getFirestoreAdmin(firebaseApp);
    }

    // Inisialisasi Storage Bucket
    if (bucketName) {
      storageBucket = getStorage(firebaseApp).bucket();
      console.log(`✅ Firebase Storage initialized (Bucket: ${bucketName})`);
    }

  } catch (error) {
    console.warn('⚠️ Firebase Admin initialization skipped:', error.message);
  }

  return firebaseApp;
};

const getFirestore = () => firestoreDb;
const getBucket = () => storageBucket; // TAMBAHKAN EXPORT INI

module.exports = { admin, initializeFirebase, getFirestore, getBucket };