import mongoose, { Schema, Document } from 'mongoose';

export interface IShop extends Document {
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin?: string;
  license?: string;
  owner: mongoose.Types.ObjectId;
  currency: string;
  taxRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const shopSchema = new Schema<IShop>(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    gstin: {
      type: String,
      default: '',
    },
    license: {
      type: String,
      default: '',
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    taxRate: {
      type: Number,
      default: 18,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Shop || mongoose.model<IShop>('Shop', shopSchema);
