import mongoose, { Document, Schema } from 'mongoose';

// Vendor information embedded in SKU
export interface IVendor {
  vendorId: mongoose.Types.ObjectId;
  name: string;
  vendorSKU: string;
  leadTimeDays: number;
  lastCost: number;
  preferred: boolean;
  contactInfo: {
    email?: string;
    phone?: string;
  };
  notes?: string;
}

// SKU information embedded in Product
export interface ISKU {
  skuCode: string;
  barcode?: string;
  attributes: {
    size?: string;
    color?: string;
    material?: string;
    [key: string]: any;
  };
  cost: number;
  priceList: {
    retail: number;
    wholesaleTier1: number;
    wholesaleTier2: number;
  };
  stockQty: number;
  status: 'ACTIVE' | 'ARCHIVED';
  vendors: IVendor[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct extends Document {
  name: string;
  description?: string;
  categoryId?: mongoose.Types.ObjectId;
  brand?: string;
  barcode?: string;
  price?: number;
  skus: ISKU[];
  tags: string[];
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Vendor sub-schema
const vendorSchema = new Schema<IVendor>({
  vendorId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Vendor'
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  vendorSKU: {
    type: String,
    required: true,
    trim: true
  },
  leadTimeDays: {
    type: Number,
    required: true,
    min: 0,
    default: 7
  },
  lastCost: {
    type: Number,
    required: true,
    min: 0
  },
  preferred: {
    type: Boolean,
    default: false
  },
  contactInfo: {
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, { _id: false });

// SKU sub-schema
const skuSchema = new Schema<ISKU>({
  skuCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  barcode: {
    type: String,
    trim: true,
    sparse: true, // Allows multiple null values but unique non-null values
    index: true
  },
  attributes: {
    type: Schema.Types.Mixed,
    default: {}
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  priceList: {
    retail: {
      type: Number,
      required: true,
      min: 0
    },
    wholesaleTier1: {
      type: Number,
      required: true,
      min: 0
    },
    wholesaleTier2: {
      type: Number,
      required: true,
      min: 0
    }
  },
  stockQty: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED'],
    default: 'ACTIVE'
  },
  vendors: [vendorSchema]
}, { 
  timestamps: true,
  _id: false 
});

// Main Product schema
const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true,
    maxlength: 100
  },
  barcode: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allows multiple null values but unique non-null values
    index: true
  },
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  skus: {
    type: [skuSchema],
    required: true,
    validate: {
      validator: function(skus: ISKU[]) {
        return skus && skus.length > 0;
      },
      message: 'Product must have at least one SKU'
    }
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance (as specified in PRD)
productSchema.index({ barcode: 1 }, { unique: true, sparse: true });
productSchema.index({ 'skus.skuCode': 1 }, { unique: true });
productSchema.index({ 'skus.barcode': 1 }, { sparse: true });
productSchema.index({ 'skus.vendors.vendorId': 1 });
productSchema.index({ name: 'text', description: 'text', 'skus.skuCode': 'text' });
productSchema.index({ categoryId: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ isActive: 1 });

// Pre-save middleware to auto-generate SKU codes if not provided
productSchema.pre<IProduct>('save', async function(next) {
  try {
    for (let sku of this.skus) {
      if (!sku.skuCode) {
        // Generate SKU code: PROD-{productId}-{timestamp}
        const timestamp = Date.now().toString().slice(-6);
        const productId = this._id ? this._id.toString().slice(-6).toUpperCase() : 'NEW';
        sku.skuCode = `PROD-${productId}-${timestamp}`;
      }
    }
    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error(String(error)));
  }
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
