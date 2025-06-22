import { Request, Response } from "express";
import { razorpay } from "../utils/helpers";
import { IUser } from "../types/user.types";
import { OrderModel } from "../models/order.model";
import { CONSTANTS } from "../config/constant";
import axios from "axios";
import { ProductModel } from "../models/Product.model";
// Create Razorpay Order

export const getOrders = async (req: Request, res: Response) => {
    try {
        const user = req.user as IUser;

        const orders = await OrderModel.find({ user: user._id })
            .populate("items.product", "title price image") // Adjust as per your Product schema
            .sort({ createdAt: -1 });

        res.status(CONSTANTS.STATUS_CODES.OK).json({
            success: true,
            message: "Orders fetched successfully",
            orders,
        });
        return
    } catch (error) {
        console.error("Get Orders Error:", error);
        res.status(CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: CONSTANTS.ERROR_MESSAGES.INTERNAL_SERVER,
        });
        return
    }
};

export const createOrder = async (req: Request, res: Response) => {
    try {
      const user = req.user as IUser;
      const { items } = req.body;
  
      if (!items || !Array.isArray(items) || items.length === 0) {
         res.status(400).json({ success: false, message: "Items are required" });
         return
      }
  
      let totalAmount = 0;
      const validatedItems = [];
  
      for (const item of items) {
        const product = await ProductModel.findById(item.product);
  
        if (!product) {
           res.status(404).json({
            success: false,
            message: `Product with ID ${item.product} not found`,
          });
          return
        }
  
        const qty = item.qty;
        const price = product.price;
  
        totalAmount += price * qty;
  
        validatedItems.push({
          product: product._id,
          qty,
        });
      }
  
      // Step 1: Create local order in DB
      const newOrder = await OrderModel.create({
        user: user._id,
        items: validatedItems,
        totalAmount,
      });
  
      // Step 2: Create Razorpay Payment Link
      const paymentLink = await razorpay.paymentLink.create({
        amount: totalAmount * 100, // in paise
        currency: "INR",
        description: "Order Payment",
        customer: {
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          contact: user.phone || "",
        },
        notify: {
          sms: true,
          email: true,
        },
        callback_url: `${process.env.FRONTEND_URL}/order/verify`,
        callback_method: "get",
        reference_id: newOrder._id.toString(),
      });
  
      // Step 3: Save Razorpay payment link ID
      newOrder.razorpayPaymentLinkId = paymentLink.id;
      await newOrder.save();
  
       res.status(201).json({
        success: true,
        message: "Order created and payment link generated",
        orderId: newOrder._id,
        paymentLink: paymentLink.short_url,
        paymentLinkId:paymentLink.id
      });
      return
    } catch (error) {
      console.error("Create Order Error:", error);
       res.status(500).json({ success: false, message: "Order creation failed" });
       return
    }
  };
  

  export const verifyPayment = async (req: Request, res: Response) => {
    try {
      const { payment_link_id } = req.query;
  
      if (!payment_link_id || typeof payment_link_id !== "string") {
         res.status(400).json({ success: false, message: "Missing payment_link_id" });
         return
      }
  
      // 1. Get payment link details (correct API)
      const linkRes = await axios.get(
        `https://api.razorpay.com/v1/payment_links/${payment_link_id}`,
        {
          auth: {
            username: process.env.RAZORPAY_KEY_ID!,
            password: process.env.RAZORPAY_KEY_SECRET!,
          },
        }
      );
  
      const paymentLink = linkRes.data;
  
      // 2. Check if payment was successful
      if (paymentLink.status !== "paid") {
         res.status(400).json({ success: false, message: "Payment not completed yet" });
         return
      }
  
      const paymentId = paymentLink.payments?.[0] || null;
  
      // 3. Update your order
      const updatedOrder = await OrderModel.findOneAndUpdate(
        { razorpayPaymentLinkId: payment_link_id },
        {
          status: "paid",
          razorpayPaymentId: paymentId,
        },
        { new: true }
      );
  
      if (!updatedOrder) {
         res.status(404).json({ success: false, message: "Order not found" });
         return
      }
  
       res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        order: updatedOrder,
      });
      return
    } catch (error) {
      console.error("Verify Payment Error:", error);
       res.status(500).json({ success: false, message: "Failed to verify payment" });
       return
    }
  };

  export const cancelOrder = async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const user = req.user as IUser;
  
      if (!orderId) {
         res.status(400).json({ success: false, message: "Invalid Order ID" });
         return
      }
  
      const order = await OrderModel.findOne({ _id: orderId, user: user._id });
  
      if (!order) {
         res.status(404).json({ success: false, message: "Order not found" });
         return
      }
  
      if (order.status === "cancelled") {
         res.status(400).json({ success: false, message: "Order already cancelled" });
         return
      }
  
      if (["delivered", "out for delivery"].includes(order.status)) {
         res.status(400).json({ success: false, message: `Cannot cancel an order that is already ${order.status}` });
         return
      }
  
      // Refund for paid orders
      if (order.status === "paid") {
        if (!order.razorpayPaymentId) {
           res.status(400).json({ success: false, message: "Payment ID not found for refund" });
           return
        }
  
        try {
          const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
            amount: order.totalAmount * 100,
            notes: { reason: "User cancelled the order" },
          });
  
          order.status = "cancelled";
          await order.save();
  
           res.status(200).json({
            success: true,
            message: "Order cancelled and refund initiated",
            refund,
          });
          return
        } catch (refundError) {
          console.error("Refund Error:", refundError);
           res.status(500).json({ success: false, message: "Refund failed. Try again later." });
           return
        }
      }
  
      // Cancel unpaid order
      order.status = "cancelled";
      await order.save();
  
       res.status(200).json({
        success: true,
        message: "Order cancelled successfully",
        order,
      });
      return
    } catch (error) {
      console.error("Cancel Order Error:", error);
       res.status(500).json({ success: false, message: "Internal Server Error" });
       return
    }
  };
