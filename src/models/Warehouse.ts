import mongoose, { Document, Schema } from 'mongoose';

export interface IWarehouse extends Document {
  name: string;
  code: string;
  location: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contactInfo: {
    phone?: string;
    email?: string;
    manager?: string;
  };
  isActive: boolean;
  settings: {
    allowNegativeStock: boolean;
    defaultTaxRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const warehouseSchema = new Schema<IWarehouse>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    maxlength: 10
  },
  location: {
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: 'Greece'
    },
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    manager: {
      type: String,
      trim: true,
      maxlength: 100
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    allowNegativeStock: {
      type: Boolean,
      default: false
    },
    defaultTaxRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.24 // 24% VAT for Greece
    }
  }
}, {
  timestamps: true
});

// Indexes
warehouseSchema.index({ code: 1 }, { unique: true });
warehouseSchema.index({ isActive: 1 });
warehouseSchema.index({ 'location.city': 1 });

export const Warehouse = mongoose.model<IWarehouse>('Warehouse', warehouseSchema);
