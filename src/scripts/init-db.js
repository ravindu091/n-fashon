const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');

// Use reliable public DNS (Google & Cloudflare) for Atlas SRV record resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // fallback to system default
}

const MONGODB_URI = 'mongodb+srv://n-fashon:ilg7MgNOYrKhaDrQ@cluster0.5s9dar3.mongodb.net/reselling?appName=Cluster0';

async function initDatabase() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI, { dbName: 'reselling' });
  console.log('Connected successfully to database: reselling');

  const db = mongoose.connection.db;

  // 1. Create all Collections ("Tables")
  const collectionsToCreate = [
    'users',
    'settings',
    'sequencecounters',
    'products',
    'productvariants',
    'suppliers',
    'customers',
    'purchases',
    'stockbatches',
    'stockmovements',
    'sales',
    'returns',
    'expenses'
  ];

  const existingCollections = (await db.listCollections().toArray()).map(c => c.name);
  console.log('Existing collections:', existingCollections);

  for (const colName of collectionsToCreate) {
    if (!existingCollections.includes(colName)) {
      await db.createCollection(colName);
      console.log(`Created collection (table): ${colName}`);
    } else {
      console.log(`Collection already exists: ${colName}`);
    }
  }

  // 2. Setup Indexes for Performance and Integrity
  console.log('Setting up indexes...');
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('products').createIndex({ code: 1 }, { unique: true });
  await db.collection('products').createIndex({ name: 'text', code: 'text' });
  await db.collection('productvariants').createIndex({ code: 1 }, { unique: true });
  await db.collection('productvariants').createIndex({ productId: 1, size: 1, color: 1 }, { unique: true });
  await db.collection('suppliers').createIndex({ code: 1 }, { unique: true });
  await db.collection('customers').createIndex({ code: 1 }, { unique: true });
  await db.collection('purchases').createIndex({ purchaseNumber: 1 }, { unique: true });
  await db.collection('stockbatches').createIndex({ batchCode: 1 }, { unique: true });
  await db.collection('stockbatches').createIndex({ variantId: 1, status: 1, receivedDate: 1 });
  await db.collection('stockmovements').createIndex({ variantId: 1, createdAt: -1 });
  await db.collection('sales').createIndex({ saleNumber: 1 }, { unique: true });
  await db.collection('sales').createIndex({ idempotencyKey: 1 }, { unique: true });
  await db.collection('returns').createIndex({ returnNumber: 1 }, { unique: true });
  await db.collection('expenses').createIndex({ expenseNumber: 1 }, { unique: true });
  console.log('All indexes created successfully.');

  // 3. Seed Default Accounts
  console.log('Seeding default user accounts...');
  const adminPass = await bcrypt.hash('admin123', 10);
  const managerPass = await bcrypt.hash('inventory123', 10);
  const staffPass = await bcrypt.hash('sales123', 10);

  const defaultUsers = [
    {
      name: 'N-Fashion Admin Owner',
      email: 'admin@nfashion.lk',
      passwordHash: adminPass,
      role: 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Inventory Manager',
      email: 'inventory@nfashion.lk',
      passwordHash: managerPass,
      role: 'inventory_manager',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Sales Staff POS',
      email: 'sales@nfashion.lk',
      passwordHash: staffPass,
      role: 'sales_staff',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  for (const user of defaultUsers) {
    await db.collection('users').updateOne(
      { email: user.email },
      { $set: user },
      { upsert: true }
    );
    console.log(`User configured: ${user.email} (${user.role})`);
  }

  // 4. Seed Default Settings
  console.log('Seeding business settings...');
  const defaultSettings = {
    businessName: 'N-Fashion Clothing Reselling',
    currency: 'LKR',
    locale: 'en-LK',
    timezone: 'Asia/Colombo',
    dateFormat: 'dd/MM/yyyy',
    categories: ['T-Shirts', 'Shirts', 'Trousers', 'Jeans', 'Dresses', 'Skirts', 'Hoodies', 'Jackets', 'Shorts', 'Other'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'],
    colors: ['Black', 'White', 'Navy Blue', 'Red', 'Blue', 'Green', 'Grey', 'Charcoal', 'Beige', 'Pink'],
    channels: ['Physical', 'Facebook', 'Instagram', 'WhatsApp', 'Other'],
    expenseCategories: ['Advertising', 'Packaging', 'Delivery', 'Transport', 'Utilities', 'Rent', 'Platform Fees', 'Other'],
    lowStockThreshold: 3,
    batchAllocation: 'fifo',
    taxEnabled: false,
    receiptFooter: 'Thank you for shopping at N-Fashion! Exchange within 7 days with valid receipt.',
    contactPhone: '077 123 4567',
    address: '124 Galle Road, Colombo 03, Sri Lanka',
    updatedAt: new Date()
  };

  await db.collection('settings').updateOne(
    {},
    { $set: defaultSettings, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  // 5. Seed Initial Suppliers (if none exist)
  const supplierCount = await db.collection('suppliers').countDocuments();
  let supplier1Id, supplier2Id;
  if (supplierCount === 0) {
    console.log('Seeding initial suppliers...');
    const s1 = await db.collection('suppliers').insertOne({
      code: 'SUP-0001',
      name: 'Colombo Garments Wholesale Ltd',
      contactPerson: 'Kamal Perera',
      phone: '0771234567',
      email: 'sales@colombogarments.lk',
      address: 'Industrial Zone, Katunayake',
      status: 'active',
      totalPurchases: 150000,
      outstandingBalance: 25000,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    supplier1Id = s1.insertedId;

    const s2 = await db.collection('suppliers').insertOne({
      code: 'SUP-0002',
      name: 'Kandy Textile Mill Importers',
      contactPerson: 'Saman Jayasinghe',
      phone: '0714567890',
      email: 'kandytextiles@gmail.com',
      address: 'Peradeniya Road, Kandy',
      status: 'active',
      totalPurchases: 85000,
      outstandingBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    supplier2Id = s2.insertedId;
    console.log('Suppliers seeded: SUP-0001, SUP-0002');
  } else {
    const s = await db.collection('suppliers').findOne();
    supplier1Id = s._id;
  }

  // 6. Seed Initial Customers (if none exist)
  const customerCount = await db.collection('customers').countDocuments();
  let customer1Id;
  if (customerCount === 0) {
    console.log('Seeding initial customers...');
    const c1 = await db.collection('customers').insertOne({
      code: 'CUS-0001',
      name: 'Nimali Senanayake',
      phone: '0761122334',
      email: 'nimali@gmail.com',
      address: '45 Havelock Road, Colombo 05',
      status: 'active',
      totalPurchases: 18500,
      outstandingBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    customer1Id = c1.insertedId;

    await db.collection('customers').insertOne({
      code: 'CUS-0002',
      name: 'Dilan Rathnayake',
      phone: '0779988776',
      email: 'dilan.r@yahoo.com',
      address: '12 Kandy Road, Kiribathgoda',
      status: 'active',
      totalPurchases: 9200,
      outstandingBalance: 2500,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Customers seeded: CUS-0001, CUS-0002');
  }

  // 7. Seed Initial Products & Variants (if none exist)
  const productCount = await db.collection('products').countDocuments();
  if (productCount === 0) {
    console.log('Seeding products & garment variants...');

    // Product 1: Oversized Cotton T-Shirt
    const p1 = await db.collection('products').insertOne({
      code: 'TSH-0001',
      name: 'Oversized Heavyweight Cotton T-Shirt',
      category: 'T-Shirts',
      brand: 'N-Fashion Originals',
      description: '240 GSM 100% combed cotton, drop-shoulder streetwear fit.',
      defaultSellingPrice: 2800,
      colors: ['Black', 'White'],
      sizes: ['M', 'L', 'XL'],
      images: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const v1_1 = await db.collection('productvariants').insertOne({
      code: 'TSH-0001-BLA-M',
      productId: p1.insertedId,
      size: 'M',
      color: 'Black',
      defaultSellingPrice: 2800,
      promoPrice: 2600,
      reorderLevel: 3,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const v1_2 = await db.collection('productvariants').insertOne({
      code: 'TSH-0001-BLA-L',
      productId: p1.insertedId,
      size: 'L',
      color: 'Black',
      defaultSellingPrice: 2800,
      reorderLevel: 3,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const v1_3 = await db.collection('productvariants').insertOne({
      code: 'TSH-0001-WHI-M',
      productId: p1.insertedId,
      size: 'M',
      color: 'White',
      defaultSellingPrice: 2800,
      reorderLevel: 3,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Product 2: Slim Fit Stretch Jeans
    const p2 = await db.collection('products').insertOne({
      code: 'JNS-0002',
      name: 'Slim Fit Stretch Denim Jeans',
      category: 'Jeans',
      brand: 'Zara Overstock',
      description: 'Premium stretch denim with dark indigo wash.',
      defaultSellingPrice: 4800,
      colors: ['Navy Blue'],
      sizes: ['30', '32', '34'],
      images: [],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const v2_1 = await db.collection('productvariants').insertOne({
      code: 'JNS-0002-NAV-32',
      productId: p2.insertedId,
      size: '32',
      color: 'Navy Blue',
      defaultSellingPrice: 4800,
      reorderLevel: 2,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 8. Seed Stock Batches with Landed Costs
    console.log('Seeding physical stock batches...');
    const now = new Date();
    const batch1 = await db.collection('stockbatches').insertOne({
      batchCode: 'BAT-20261001-0001',
      productId: p1.insertedId,
      variantId: v1_1.insertedId,
      supplierId: supplier1Id,
      productCode: 'TSH-0001',
      variantCode: 'TSH-0001-BLA-M',
      productName: 'Oversized Heavyweight Cotton T-Shirt',
      size: 'M',
      color: 'Black',
      supplierName: 'Colombo Garments Wholesale Ltd',
      purchaseDate: new Date('2026-10-01'),
      receivedDate: new Date('2026-10-02'),
      startingQty: 25,
      remainingQty: 20, // 5 sold
      unitBuyingCost: 1100,
      allocatedShippingPerUnit: 50,
      allocatedOtherCostPerUnit: 20,
      landedUnitCost: 1170, // 1100 + 50 + 20
      status: 'active',
      createdAt: new Date('2026-10-02'),
      updatedAt: new Date()
    });

    const batch2 = await db.collection('stockbatches').insertOne({
      batchCode: 'BAT-20261003-0002',
      productId: p1.insertedId,
      variantId: v1_2.insertedId,
      supplierId: supplier1Id,
      productCode: 'TSH-0001',
      variantCode: 'TSH-0001-BLA-L',
      productName: 'Oversized Heavyweight Cotton T-Shirt',
      size: 'L',
      color: 'Black',
      supplierName: 'Colombo Garments Wholesale Ltd',
      purchaseDate: new Date('2026-10-01'),
      receivedDate: new Date('2026-10-03'),
      startingQty: 15,
      remainingQty: 15,
      unitBuyingCost: 1100,
      allocatedShippingPerUnit: 50,
      allocatedOtherCostPerUnit: 20,
      landedUnitCost: 1170,
      status: 'active',
      createdAt: new Date('2026-10-03'),
      updatedAt: new Date()
    });

    const batch3 = await db.collection('stockbatches').insertOne({
      batchCode: 'BAT-20261005-0003',
      productId: p2.insertedId,
      variantId: v2_1.insertedId,
      supplierId: supplier1Id,
      productCode: 'JNS-0002',
      variantCode: 'JNS-0002-NAV-32',
      productName: 'Slim Fit Stretch Denim Jeans',
      size: '32',
      color: 'Navy Blue',
      supplierName: 'Colombo Garments Wholesale Ltd',
      purchaseDate: new Date('2026-10-04'),
      receivedDate: new Date('2026-10-05'),
      startingQty: 12,
      remainingQty: 10, // 2 sold
      unitBuyingCost: 2400,
      allocatedShippingPerUnit: 100,
      allocatedOtherCostPerUnit: 30,
      landedUnitCost: 2530,
      status: 'active',
      createdAt: new Date('2026-10-05'),
      updatedAt: new Date()
    });

    // 9. Stock Movement Audit Ledger
    console.log('Seeding stock movement audit ledger...');
    await db.collection('stockmovements').insertMany([
      {
        variantId: v1_1.insertedId,
        batchId: batch1.insertedId,
        productId: p1.insertedId,
        variantCode: 'TSH-0001-BLA-M',
        productName: 'Oversized Heavyweight Cotton T-Shirt',
        size: 'M',
        color: 'Black',
        type: 'purchase_receipt',
        qtyChange: 25,
        beforeQty: 0,
        afterQty: 25,
        referenceType: 'Purchase',
        referenceNumber: 'PO-20261001-0001',
        reason: 'Initial stock intake from Colombo Garments',
        userName: 'Admin Owner',
        createdAt: new Date('2026-10-02'),
      },
      {
        variantId: v1_1.insertedId,
        batchId: batch1.insertedId,
        productId: p1.insertedId,
        variantCode: 'TSH-0001-BLA-M',
        productName: 'Oversized Heavyweight Cotton T-Shirt',
        size: 'M',
        color: 'Black',
        type: 'sale',
        qtyChange: -5,
        beforeQty: 25,
        afterQty: 20,
        referenceType: 'Sale',
        referenceNumber: 'SL-20261008-0001',
        reason: 'Order fulfillment',
        userName: 'Sales Staff POS',
        createdAt: new Date('2026-10-08'),
      }
    ]);

    // 10. Sample Completed Sale
    console.log('Seeding sample confirmed sale...');
    await db.collection('sales').insertOne({
      saleNumber: 'SL-20261008-0001',
      saleDate: new Date('2026-10-08'),
      customerId: customer1Id,
      customerName: 'Nimali Senanayake',
      channel: 'instagram',
      lines: [
        {
          variantId: v1_1.insertedId,
          batchId: batch1.insertedId,
          productId: p1.insertedId,
          productCode: 'TSH-0001',
          variantCode: 'TSH-0001-BLA-M',
          productName: 'Oversized Heavyweight Cotton T-Shirt',
          size: 'M',
          color: 'Black',
          qty: 5,
          unitSellingPrice: 2800,
          unitCostSnapshot: 1170, // Frozen landed cost
          discountAmount: 0,
          lineTotal: 14000,
          lineCOGS: 5850, // 5 * 1170
        }
      ],
      subtotal: 14000,
      discountAmount: 500,
      deliveryCharge: 350,
      taxAmount: 0,
      totalAmount: 13850,
      totalCOGS: 5850,
      grossProfit: 7650, // (14000 - 500) - 5850
      paymentMethod: 'bank_transfer',
      paymentStatus: 'paid',
      amountReceived: 13850,
      outstandingBalance: 0,
      status: 'confirmed',
      notes: 'Instagram DM order. Shipped via Prompt Xpress.',
      idempotencyKey: 'seed-sale-001',
      createdAt: new Date('2026-10-08'),
      updatedAt: new Date()
    });

    // 11. Sample Operating Expenses
    console.log('Seeding operating expenses...');
    await db.collection('expenses').insertMany([
      {
        expenseNumber: 'EXP-20261002-0001',
        date: new Date('2026-10-02'),
        category: 'Advertising',
        description: 'Meta Instagram Ads campaign for new drop',
        amount: 3500,
        paymentMethod: 'card',
        payee: 'Meta Ads',
        status: 'paid',
        isAcquisitionCost: false,
        createdAt: new Date('2026-10-02')
      },
      {
        expenseNumber: 'EXP-20261004-0002',
        date: new Date('2026-10-04'),
        category: 'Packaging',
        description: 'Custom poly-mailers and thank you cards (100 pcs)',
        amount: 2200,
        paymentMethod: 'cash',
        payee: 'Print Masters Colombo',
        status: 'paid',
        isAcquisitionCost: false,
        createdAt: new Date('2026-10-04')
      }
    ]);
  }

  // 12. Sequence Counters
  await db.collection('sequencecounters').updateOne(
    { key: 'product' },
    { $set: { seq: 2 } },
    { upsert: true }
  );
  await db.collection('sequencecounters').updateOne(
    { key: 'supplier' },
    { $set: { seq: 2 } },
    { upsert: true }
  );
  await db.collection('sequencecounters').updateOne(
    { key: 'customer' },
    { $set: { seq: 2 } },
    { upsert: true }
  );

  console.log('\n======================================================');
  console.log('🎉 DATABASE SETUP & SEEDING COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
  console.log('Collections ("tables") initialized: 13');
  console.log('Default accounts ready:');
  console.log('  1. Admin:             admin@nfashion.lk     / admin123');
  console.log('  2. Inventory Manager: inventory@nfashion.lk / inventory123');
  console.log('  3. Sales Staff POS:   sales@nfashion.lk     / sales123');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

initDatabase().catch(err => {
  console.error('Fatal initialization error:', err);
  process.exit(1);
});
