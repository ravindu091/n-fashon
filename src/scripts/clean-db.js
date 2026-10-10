const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://n-fashon:ilg7MgNOYrKhaDrQ@cluster0.5s9dar3.mongodb.net/reselling?appName=Cluster0';

async function cleanDatabase() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI, { dbName: 'reselling' });
  console.log('Connected to database: reselling');

  const db = mongoose.connection.db;

  const collectionsToClear = [
    'products',
    'productvariants',
    'suppliers',
    'customers',
    'purchases',
    'stockbatches',
    'stockmovements',
    'sales',
    'returns',
    'expenses',
    'sequencecounters'
  ];

  console.log('\n--- Cleaning Business Data ---');
  for (const colName of collectionsToClear) {
    try {
      const result = await db.collection(colName).deleteMany({});
      console.log(`Cleared ${colName}: deleted ${result.deletedCount} record(s).`);
    } catch (err) {
      console.warn(`Could not clear ${colName}:`, err.message);
    }
  }

  // Verify accounts remain intact
  const usersCount = await db.collection('users').countDocuments();
  console.log(`\nActive user accounts preserved: ${usersCount}`);

  const settingsCount = await db.collection('settings').countDocuments();
  console.log(`Business settings preserved: ${settingsCount}`);

  console.log('\n======================================================');
  console.log('✨ DATABASE SUCCESSFULLY RESET TO CLEAN SLATE!');
  console.log('All dummy products, variants, customers, suppliers,');
  console.log('purchases, batches, movements, and sales have been cleared.');
  console.log('You can now enter your real business data.');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

cleanDatabase().catch(err => {
  console.error('Clean error:', err);
  process.exit(1);
});
