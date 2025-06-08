import { Document, Types } from "mongoose";

export interface IOrderItem {
  product: Types.ObjectId;
  qty: number;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  currency: string;

  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  status: "created" | "paid" | "failed" | "cancelled" | "delivered" | "out for delivery";

  createdAt: Date;
  updatedAt: Date;
}
