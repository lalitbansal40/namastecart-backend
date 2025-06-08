import mongoose, { Schema, Model } from "mongoose";
import { IAddress, IUser } from "../types/user.types";

const CartItemSchema = new Schema<{ itemId: string, qty: number }>(
  {
    itemId: { type: String, required: true },
    qty: { type: Number, required: true, default: 1 },
  },
  { _id: false } // prevent Mongoose from creating _id for sub-doc
);
// Address Schema
const AddressSchema: Schema<IAddress> = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  postalCode: { type: String, required: true },
  landmark: { type: String },
}, { _id: false });

// User Schema
const UserSchema: Schema = new Schema<IUser>({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
  address: { type: AddressSchema, required: true },
  cart: [CartItemSchema],
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, {
  timestamps: true // adds createdAt and updatedAt
});

// Export Mongoose Model
const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default UserModel;
