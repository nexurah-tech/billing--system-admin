import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  shop: mongoose.Types.ObjectId;
  role: 'owner' | 'staff';
  status: 'pending' | 'active' | 'blocked' | 'inactive' | 'rejected';
  blockReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'staff'],
      default: 'staff',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'blocked', 'inactive', 'rejected'],
      default: 'pending',
    },
    blockReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model<IUser>('User', userSchema);
