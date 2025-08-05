import { z } from 'zod';

// User schemas
export const userRoleSchema = z.enum(['admin', 'manager', 'picker', 'cashier', 'sales_rep']);

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  roles: z.array(userRoleSchema).min(1, 'At least one role is required'),
  isActive: z.boolean().optional().default(true)
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

// Product schemas
export const vendorSchema = z.object({
  vendorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid vendor ID'),
  name: z.string().min(1, 'Vendor name is required'),
  vendorSKU: z.string().min(1, 'Vendor SKU is required'),
  leadTimeDays: z.number().int().min(0).default(7),
  lastCost: z.number().min(0),
  preferred: z.boolean().default(false),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional()
  }).optional(),
  notes: z.string().max(500).optional()
});

export const skuSchema = z.object({
  skuCode: z.string().min(1, 'SKU code is required').optional(), // Auto-generated if not provided
  barcode: z.string().optional(),
  attributes: z.record(z.any()).default({}),
  cost: z.number().min(0).default(0),
  priceList: z.object({
    retail: z.number().min(0),
    wholesaleTier1: z.number().min(0),
    wholesaleTier2: z.number().min(0)
  }),
  stockQty: z.number().min(0).default(0),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  vendors: z.array(vendorSchema).default([])
});

export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(1000).optional(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID').optional(),
  brand: z.string().max(100).optional(),
  barcode: z.string().optional(),
  price: z.number().min(0).optional(),
  skus: z.array(skuSchema).min(1, 'At least one SKU is required'),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  isActive: z.boolean().default(true)
});

export const updateProductSchema = createProductSchema.partial();

export const bulkUpdateStockSchema = z.object({
  updates: z.array(z.object({
    skuCode: z.string().min(1, 'SKU code is required'),
    newQty: z.number().min(0),
    notes: z.string().max(500).optional()
  })).min(1, 'At least one update is required')
});

// Stock Movement schemas
export const stockMovementTypeSchema = z.enum(['IN', 'OUT', 'ADJ']);
export const refTypeSchema = z.enum(['PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'RETURN']);

export const createStockMovementSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  skuCode: z.string().min(1, 'SKU code is required'),
  qty: z.number().refine(val => val !== 0, 'Quantity cannot be zero'),
  type: stockMovementTypeSchema,
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
  refType: refTypeSchema,
  refId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid reference ID').optional(),
  unitCost: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
  timestamp: z.date().optional().default(() => new Date())
});

// Order schemas
export const orderLineSchema = z.object({
  skuCode: z.string().min(1, 'SKU code is required'),
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  qty: z.number().min(0.001, 'Quantity must be greater than 0'),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0)
});

export const createOrderSchema = z.object({
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid customer ID').optional(),
  customerInfo: z.object({
    name: z.string().min(1, 'Customer name is required').max(200),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().max(500).optional()
  }),
  lines: z.array(orderLineSchema).min(1, 'At least one line item is required'),
  discountAmount: z.number().min(0).default(0),
  channel: z.enum(['POS', 'B2B', 'ONLINE']),
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'CREDIT']).optional(),
  notes: z.string().max(1000).optional()
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  notes: z.string().max(500).optional()
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['PENDING', 'PAID', 'PARTIAL', 'REFUNDED']),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'CREDIT']).optional(),
  notes: z.string().max(500).optional()
});

// Warehouse schemas
export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(100),
  code: z.string().min(1, 'Warehouse code is required').max(10),
  location: z.object({
    address: z.string().min(1, 'Address is required').max(200),
    city: z.string().min(1, 'City is required').max(100),
    postalCode: z.string().min(1, 'Postal code is required').max(20),
    country: z.string().max(100).default('Greece'),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180)
    }).optional()
  }),
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    manager: z.string().max(100).optional()
  }).optional(),
  settings: z.object({
    allowNegativeStock: z.boolean().default(false),
    defaultTaxRate: z.number().min(0).max(1).default(0.24)
  }).optional()
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('-createdAt'),
  search: z.string().optional()
});

export const productQuerySchema = paginationSchema.extend({
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  brand: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  inStock: z.coerce.boolean().optional()
});

export const orderQuerySchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'CONFIRMED', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  channel: z.enum(['POS', 'B2B', 'ONLINE']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'PARTIAL', 'REFUNDED']).optional(),
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional()
});

export const movementQuerySchema = paginationSchema.extend({
  type: stockMovementTypeSchema.optional(),
  refType: refTypeSchema.optional(),
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  skuCode: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional()
});

// Report schemas
export const stockReportSchema = z.object({
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  lowStockThreshold: z.coerce.number().min(0).default(10),
  format: z.enum(['json', 'csv', 'pdf']).default('json')
});

export const salesReportSchema = z.object({
  warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date(),
  groupBy: z.enum(['day', 'week', 'month', 'product', 'category']).default('day'),
  format: z.enum(['json', 'csv', 'pdf']).default('json')
});

// Response schemas for API documentation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
  errors: z.array(z.string()).optional(),
  meta: z.object({
    total: z.number().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    totalPages: z.number().optional()
  }).optional()
});

export type ApiResponse<T = any> = z.infer<typeof apiResponseSchema> & {
  data?: T;
};
