import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Item } from '../models/item.model';
import prisma from '../config/postgres';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://beamup:beamup_secret@localhost:27017/beamup_db?authSource=admin';

const seedItems = [
  { sku: 'SKU-001', name: 'Industrial Sensor A', category: 'Electronics', quantity: 150, warehouseId: 'WH-NY-01', price: 89.99, status: 'in_stock' as const, tags: ['sensor', 'iot'] },
  { sku: 'SKU-002', name: 'Conveyor Belt Module', category: 'Machinery', quantity: 8,   warehouseId: 'WH-NY-01', price: 1299.00, status: 'low_stock' as const, tags: ['conveyor'] },
  { sku: 'SKU-003', name: 'RFID Scanner v2',     category: 'Electronics', quantity: 0,   warehouseId: 'WH-LA-01', price: 349.99, status: 'out_of_stock' as const, tags: ['rfid', 'scanner'] },
  { sku: 'SKU-004', name: 'Pallet Wrap Film',    category: 'Packaging',   quantity: 500, warehouseId: 'WH-LA-01', price: 12.50, tags: ['packaging', 'wrap'] },
  { sku: 'SKU-005', name: 'Forklift Battery 48V', category: 'Energy',     quantity: 22,  warehouseId: 'WH-CHI-01', price: 2150.00, tags: ['battery', 'forklift'] },
];

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ─── MongoDB ──────────────────────────────────────────────────────────────
  await mongoose.connect(MONGO_URI);
  await Item.deleteMany({});
  const inserted = await Item.insertMany(seedItems);
  console.log(`✅ MongoDB: inserted ${inserted.length} items`);

  console.log('\n🎉 Seed complete!');
}

seed()
  .catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); })
  .finally(async () => { await mongoose.disconnect(); await prisma.$disconnect(); });
