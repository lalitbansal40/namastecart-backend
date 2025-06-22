import {  Types } from "mongoose";

export interface IOrderItem {
  product: Types.ObjectId;
  qty: number;
}

export interface IOrder {
  _id?:Types.ObjectId;
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  currency: string;

  razorpayPaymentLinkId: string;
  razorpayReferenceId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  isPaid?: boolean;
  paidAt?: Date;

  status:
    | "created"
    | "paid"
    | "failed"
    | "cancelled"
    | "expired"
    | "delivered"
    | "out for delivery";

  createdAt: Date;
  updatedAt: Date;
}
