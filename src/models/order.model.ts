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
  { _id: false } // Don't add _id to each item subdoc
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
    razorpayPaymentLinkId: {
      type: String,
      index: true,
    },
    razorpayReferenceId: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        "created",
        "paid",
        "failed",
        "cancelled",
        "expired",
        "delivered",
        "out for delivery",
      ],
      default: "created",
    },
  },
  {
    timestamps: true,
  }
);

export const OrderModel = mongoose.model<IOrder>("Order", OrderSchema);
