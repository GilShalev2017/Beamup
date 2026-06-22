import { Schema, model, Document, Types } from 'mongoose';

export interface IAnomaly extends Document {
  _id: Types.ObjectId;
  itemId: string;
  itemName: string;
  anomalyType: 'shrinkage' | 'overstock' | 'mismatch' | 'damage';
  notes: string;
  flaggedByAgent: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const anomalySchema = new Schema<IAnomaly>(
  {
    itemId:         { type: String, required: true, index: true },
    itemName:       { type: String, required: true },
    anomalyType:    { type: String, enum: ['shrinkage', 'overstock', 'mismatch', 'damage'], required: true },
    notes:          { type: String, default: '' },
    flaggedByAgent: { type: Boolean, default: false },
    resolvedAt:     { type: Date },
  },
  { timestamps: true }
);

export const Anomaly = model<IAnomaly>('Anomaly', anomalySchema);
