import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderLine {
  skuCode: string;
  productId: mongoose.Types.ObjectId;
  qty: number;
  unitPrice: number;
  discountPercent: number;
  lineTotal: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerId?: mongoose.Types.ObjectId;
  customerInfo?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  lines: IOrderLine[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: 'DRAFT' | 'CONFIRMED' | 'PICKING' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  channel: 'POS' | 'B2B' | 'ONLINE';
  warehouseId: mongoose.Types.ObjectId;
  paymentMethod?: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT';
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED';
  notes?: string;
  userId: mongoose.Types.ObjectId; // Who created the order
  createdAt: Date;
  updatedAt: Date;
}

const orderLineSchema = new Schema<IOrderLine>({
  skuCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Product'
  },
  qty: {
    type: Number,
    required: true,
    min: 0.001 // Allow fractional quantities
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lineTotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    sparse: true
  },
  customerInfo: {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  lines: {
    type: [orderLineSchema],
    required: true,
    validate: {
      validator: function(lines: IOrderLine[]) {
        return lines && lines.length > 0;
      },
      message: 'Order must have at least one line item'
    }
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['DRAFT', 'CONFIRMED', 'PICKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'DRAFT'
  },
  channel: {
    type: String,
    required: true,
    enum: ['POS', 'B2B', 'ONLINE']
  },
  warehouseId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Warehouse'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'TRANSFER', 'CREDIT']
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ['PENDING', 'PAID', 'PARTIAL', 'REFUNDED'],
    default: 'PENDING'
  },
  notes: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for performance (as specified in PRD)
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ 'lines.skuCode': 1 });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ channel: 1, createdAt: -1 });
orderSchema.index({ warehouseId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 }); // For recent orders

// Pre-save middleware to auto-generate order numbers
orderSchema.pre<IOrder>('save', async function(next) {
  if (!this.orderNumber) {
    try {
      // Generate order number: ORD-YYYYMMDD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Find the last order for today
      const lastOrder = await mongoose.model('Order').findOne({
        orderNumber: new RegExp(`^ORD-${dateStr}-`)
      }).sort({ orderNumber: -1 });

      let sequence = 1;
      if (lastOrder) {
        const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
        sequence = lastSequence + 1;
      }

      this.orderNumber = `ORD-${dateStr}-${sequence.toString().padStart(4, '0')}`;
    } catch (error) {
      return next(error as Error);
    }
  }

  // Calculate totals if lines have changed
  if (this.isModified('lines')) {
    this.subtotal = this.lines.reduce((sum, line) => {
      const lineSubtotal = line.qty * line.unitPrice;
      const discountAmount = lineSubtotal * (line.discountPercent / 100);
      line.lineTotal = lineSubtotal - discountAmount;
      return sum + line.lineTotal;
    }, 0);

    // Apply order-level discount
    const orderSubtotalAfterDiscount = this.subtotal - this.discountAmount;
    
    // Calculate tax (assuming 24% VAT for Greece as default)
    this.taxAmount = orderSubtotalAfterDiscount * 0.24;
    
    this.total = orderSubtotalAfterDiscount + this.taxAmount;
  }

  next();
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);
