require('dotenv').config();
const { initializeFirebase, getFirestore } = require('./src/config/firebase');

async function test() {
  console.log('--- Firestore Connection Test ---');
  console.log('FIREBASE_SERVICE_ACCOUNT:', process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log('FIRESTORE_DATABASE_ID:', process.env.FIRESTORE_DATABASE_ID);
  
  initializeFirebase();
  
  const db = getFirestore();
  if (!db) {
    console.log('❌ Firestore DB is NULL - Firebase not initialized correctly!');
    process.exit(1);
  }
  
  console.log('✅ Firestore instance obtained');
  
  // Try a simple read
  try {
    const snapshot = await db.collection('visit_tracking').limit(1).get();
    console.log(`✅ Firestore read OK — visit_tracking has ${snapshot.size} docs`);
    
    const snapshot2 = await db.collection('therapy_notes').limit(1).get();
    console.log(`✅ therapy_notes has ${snapshot2.size} docs`);

    // List all top-level collections
    const collections = await db.listCollections();
    console.log('📂 Collections in Firestore:', collections.map(c => c.id));
  } catch (err) {
    console.log('❌ Firestore read failed:', err.message);
  }
  
  process.exit(0);
}
test();
