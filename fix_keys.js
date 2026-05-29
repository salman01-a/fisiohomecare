const { sequelize } = require('./src/models');
async function fix() {
  try {
    const [results] = await sequelize.query("SHOW INDEX FROM users;");
    const counts = {};
    for (let r of results) {
      if (r.Key_name !== 'PRIMARY') {
        counts[r.Key_name] = (counts[r.Key_name] || 0) + 1;
      }
    }
    console.log("Indexes found:", results.map(r => r.Key_name));
    
    // We only want to drop duplicates created by Sequelize (like users_firebase_uid_uk, users_firebase_uid_uk_1, etc.)
    const keysToDrop = results.filter(r => r.Key_name.includes('firebase_uid') || r.Key_name.includes('_uk_')).map(r => r.Key_name);
    const uniqueKeysToDrop = [...new Set(keysToDrop)];
    
    for (let key of uniqueKeysToDrop) {
      console.log(`Dropping key ${key}...`);
      await sequelize.query(`ALTER TABLE users DROP INDEX ${key};`).catch(e => console.log(e.message));
    }
    
    console.log("Done fixing indexes!");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
fix();
