// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

// Switch to the warehouse-erp database
db = db.getSiblingDB('warehouse-erp');

// Create indexes for performance optimization
print('Creating indexes...');

// Products collection indexes
db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "categoryId": 1 });
db.products.createIndex({ "brand": 1 });
db.products.createIndex({ "skus.skuCode": 1 }, { unique: true });
db.products.createIndex({ "skus.barcode": 1 });
db.products.createIndex({ "skus.vendors.vendorId": 1 });

// Orders collection indexes
db.orders.createIndex({ "customerId": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "channel": 1 });
db.orders.createIndex({ "createdAt": -1 });
db.orders.createIndex({ "lines.skuCode": 1 });

// Movements collection indexes
db.movements.createIndex({ "productId": 1, "skuCode": 1 });
db.movements.createIndex({ "type": 1 });
db.movements.createIndex({ "warehouseId": 1 });
db.movements.createIndex({ "timestamp": -1 });
db.movements.createIndex({ "refType": 1, "refId": 1 });

// Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "roles": 1 });

// Warehouses collection indexes
db.warehouses.createIndex({ "name": 1 });
db.warehouses.createIndex({ "location": 1 });

print('Indexes created successfully!');

// Insert sample data for development
print('Inserting sample data...');

// Sample warehouses
db.warehouses.insertMany([
  {
    _id: ObjectId(),
    name: "Main Warehouse",
    location: "Athens, Greece",
    description: "Primary warehouse facility",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Retail Store",
    location: "Thessaloniki, Greece", 
    description: "Retail store warehouse",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Sample categories
const categories = db.categories.insertMany([
  {
    _id: ObjectId(),
    name: "Electronics",
    description: "Electronic products and accessories",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Clothing",
    description: "Apparel and accessories",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

// Sample products with SKUs
db.products.insertMany([
  {
    _id: ObjectId(),
    name: "Wireless Bluetooth Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    categoryId: categories.insertedIds[0],
    brand: "TechBrand",
    skus: [
      {
        skuCode: "WBH-001-BLK",
        barcode: "1234567890123",
        attributes: {
          color: "Black",
          model: "Pro"
        },
        cost: 75.00,
        priceList: {
          retail: 149.99,
          wholesaleTier1: 120.00,
          wholesaleTier2: 110.00
        },
        stockQty: 50,
        status: "ACTIVE",
        vendors: [
          {
            vendorId: ObjectId(),
            name: "Electronics Supplier Co",
            vendorSKU: "ESC-WBH-001",
            leadTimeDays: 7,
            lastCost: 75.00,
            preferred: true,
            contactInfo: {
              email: "orders@electronicsupplier.com",
              phone: "+30 210 1234567"
            }
          }
        ]
      },
      {
        skuCode: "WBH-001-WHT",
        barcode: "1234567890124",
        attributes: {
          color: "White",
          model: "Pro"
        },
        cost: 75.00,
        priceList: {
          retail: 149.99,
          wholesaleTier1: 120.00,
          wholesaleTier2: 110.00
        },
        stockQty: 30,
        status: "ACTIVE",
        vendors: [
          {
            vendorId: ObjectId(),
            name: "Electronics Supplier Co",
            vendorSKU: "ESC-WBH-002",
            leadTimeDays: 7,
            lastCost: 75.00,
            preferred: true,
            contactInfo: {
              email: "orders@electronicsupplier.com",
              phone: "+30 210 1234567"
            }
          }
        ]
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Cotton T-Shirt",
    description: "Premium cotton t-shirt, comfortable fit",
    categoryId: categories.insertedIds[1],
    brand: "FashionBrand",
    skus: [
      {
        skuCode: "CTS-001-S-BLU",
        barcode: "2234567890123",
        attributes: {
          size: "S",
          color: "Blue",
          material: "100% Cotton"
        },
        cost: 12.00,
        priceList: {
          retail: 29.99,
          wholesaleTier1: 22.00,
          wholesaleTier2: 20.00
        },
        stockQty: 100,
        status: "ACTIVE",
        vendors: [
          {
            vendorId: ObjectId(),
            name: "Textile Manufacturer Ltd",
            vendorSKU: "TML-CTS-S-BLU",
            leadTimeDays: 14,
            lastCost: 12.00,
            preferred: true,
            contactInfo: {
              email: "orders@textilemanufacturer.com",
              phone: "+30 210 7654321"
            }
          }
        ]
      },
      {
        skuCode: "CTS-001-M-BLU",
        barcode: "2234567890124",
        attributes: {
          size: "M",
          color: "Blue",
          material: "100% Cotton"
        },
        cost: 12.00,
        priceList: {
          retail: 29.99,
          wholesaleTier1: 22.00,
          wholesaleTier2: 20.00
        },
        stockQty: 150,
        status: "ACTIVE",
        vendors: [
          {
            vendorId: ObjectId(),
            name: "Textile Manufacturer Ltd",
            vendorSKU: "TML-CTS-M-BLU",
            leadTimeDays: 14,
            lastCost: 12.00,
            preferred: true,
            contactInfo: {
              email: "orders@textilemanufacturer.com",
              phone: "+30 210 7654321"
            }
          }
        ]
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('Sample data inserted successfully!');
print('Database initialization completed!');
