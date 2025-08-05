import mongoose, { Document, Schema } from 'mongoose';

export interface IStockMovement extends Document {
  productId: mongoose.Types.ObjectId;
  skuCode: string;
  qty: number;
  type: 'IN' | 'OUT' | 'ADJ'; // Inbound, Outbound, Adjustment
  warehouseId: mongoose.Types.ObjectId;
  refType: 'PURCHASE' | 'SALE' | 'TRANSFER' | 'ADJUSTMENT' | 'RETURN';
  refId?: mongoose.Types.ObjectId; // Reference to order, transfer, etc.
  unitCost?: number;
  notes?: string;
  userId: mongoose.Types.ObjectId; // Who made the movement
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const stockMovementSchema = new Schema<IStockMovement>({
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Product'
  },
  skuCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  qty: {
    type: Number,
    required: true,
    validate: {
      validator: function(qty: number) {
        return qty !== 0;
      },
      message: 'Quantity cannot be zero'
    }
  },
  type: {
    type: String,
    required: true,
    enum: ['IN', 'OUT', 'ADJ']
  },
  warehouseId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Warehouse'
  },
  refType: {
    type: String,
    required: true,
    enum: ['PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'RETURN']
  },
  refId: {
    type: Schema.Types.ObjectId,
    sparse: true
  },
  unitCost: {
    type: Number,
    min: 0
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance queries (as specified in PRD)
stockMovementSchema.index({ productId: 1, skuCode: 1 });
stockMovementSchema.index({ warehouseId: 1, timestamp: -1 });
stockMovementSchema.index({ type: 1, timestamp: -1 });
stockMovementSchema.index({ refType: 1, refId: 1 });
stockMovementSchema.index({ userId: 1, timestamp: -1 });
stockMovementSchema.index({ timestamp: -1 }); // For recent movements

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', stockMovementSchema);
