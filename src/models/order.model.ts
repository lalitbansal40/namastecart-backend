import mongoose, { Schema } from "mongoose";
import { IOrder } from "../types/order.types";

const OrderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    qty: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    status: {
      type: String,
      enum: ["created", "paid", "failed", "cancelled", "delivered", "out for delivery"],
      default: "created",
    }
  },
  {
    timestamps: true,
  }
);

export const OrderModel = mongoose.model<IOrder>("Order", OrderSchema);
