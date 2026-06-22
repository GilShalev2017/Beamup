import { Schema, model, Document, Types } from 'mongoose';

// ─── Interface ─────────────────────────────────────────────────────────────
export interface IItem extends Document {
  _id: Types.ObjectId;
  sku: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  warehouseId: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'in_transit';
  price: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ────────────────────────────────────────────────────────────────
const itemSchema = new Schema<IItem>(
  {
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    description: { type: String },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    warehouseId: {
      type: String,
      required: [true, 'Warehouse ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock', 'in_transit'],
      default: 'in_stock',
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ───────────────────────────────────────────────────────────────
itemSchema.index({ name: 'text', description: 'text' }); // full-text search
itemSchema.index({ category: 1, status: 1 });

// ─── Hooks ─────────────────────────────────────────────────────────────────
// Auto-derive status from quantity before saving
itemSchema.pre('save', function () {
  if (this.isModified('quantity')) {
    if (this.quantity === 0) this.status = 'out_of_stock';
    else if (this.quantity < 10) this.status = 'low_stock';
    else this.status = 'in_stock';
  }
});

// ─── Virtuals ──────────────────────────────────────────────────────────────
itemSchema.virtual('totalValue').get(function (this: IItem) {
  return this.quantity * this.price;
});

export const Item = model<IItem>('Item', itemSchema);
