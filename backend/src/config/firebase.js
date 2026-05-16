const admin = require('firebase-admin');
const path = require('path');

let firebaseApp;
let firestoreDb;

const initializeFirebase = () => {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json';

    // In production, use Application Default Credentials on GCP
    if (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else {
      const serviceAccount = require(path.resolve(serviceAccountPath));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }

    firestoreDb = admin.firestore();
    console.log('✅ Firebase Admin & Firestore initialized');
  } catch (error) {
    console.warn('⚠️  Firebase Admin initialization skipped:', error.message);
    console.warn('   NoSQL features (Firestore) will be disabled.');
  }

  return firebaseApp;
};

const getFirestore = () => firestoreDb;

module.exports = { admin, initializeFirebase, getFirestore };
