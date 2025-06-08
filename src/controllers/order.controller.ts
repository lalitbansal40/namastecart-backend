import { Request, Response } from "express";
import { ProductModel } from "../models/Product.model";
import { razorpay } from "../utils/helpers";
import crypto from "crypto";
import { IUser } from "../types/user.types";
import { OrderModel } from "../models/order.model";
import { CONSTANTS } from "../config/constant";
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
        const { items } = req.body; // [{ product: string, qty: number }]

        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ message: "Cart is empty." });
            return
        }

        let totalAmount = 0;
        const validatedItems = [];

        for (const { product, qty } of items) {
            const dbProduct = await ProductModel.findById(product);
            // console.log({dbProduct,product,qty})
            if (!dbProduct || dbProduct.stockCount < qty) {
                res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Product unavailable or out of stock." });
                return
            }

            totalAmount += dbProduct.price * qty;
            validatedItems.push({ product: dbProduct._id, qty });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: totalAmount * 100, // amount in paise
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
        });

        const order = await OrderModel.create({
            user: user._id,
            items: validatedItems,
            totalAmount,
            currency: "INR",
            razorpayOrderId: razorpayOrder.id,
            status: "created",
        });

        res.status(CONSTANTS.STATUS_CODES.CREATED).json({
            success: true,
            message: "Order created",
            orderId: razorpayOrder.id,
            amount: totalAmount,
            currency: "INR",
            orderDbId: order._id,
        });
        return
    } catch (err) {
        console.error("Create Order Error:", err);
        res.status(CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong." });
        return
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderDbId,
        } = req.body;

        const hmac = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (hmac !== razorpay_signature) {
            res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Payment verification failed" });
            return
        }

        const order = await OrderModel.findByIdAndUpdate(
            orderDbId,
            {
                status: "paid",
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
            },
            { new: true }
        );

        res.status(CONSTANTS.STATUS_CODES.OK).json({
            success: true,
            message: "Payment verified and order marked as paid",
            order,
        });
        return
    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal Server Error" });
        return
    }
};

export const cancelOrder = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const user = req.user as IUser;

        if (!orderId) {
            res.status(400).json({
                success: false,
                message: "Invalid Order ID",
            });
            return
        }

        const order = await OrderModel.findOne({ _id: orderId, user: user._id });

        if (!order) {
            res.status(404).json({
                success: false,
                message: "Order not found",
            });
            return
        }

        if (order.status === "cancelled") {
            res.status(400).json({
                success: false,
                message: "Order is already cancelled",
            });
            return
        }

        // ❌ Prevent cancellation if order is already delivered or out for delivery
        if (["delivered", "out for delivery"].includes(order.status)) {
            res.status(400).json({
                success: false,
                message: `Cannot cancel an order that is already ${order.status}`,
            });
            return
        }

        // ✅ Handle refund if payment was done
        if (order.status === "paid") {
            if (!order.razorpayPaymentId) {
                res.status(400).json({
                    success: false,
                    message: "Payment ID not found for refund",
                });
                return
            }

            try {
                const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
                    amount: order.totalAmount * 100, // in paise
                    notes: {
                        reason: "User cancelled order",
                    },
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
                res.status(500).json({
                    success: false,
                    message: "Refund failed. Try again later",
                });
                return
            }
        }

        // ✅ For unpaid orders — just cancel
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
        res.status(500).json({
            success: false,
            message: CONSTANTS.ERROR_MESSAGES.INTERNAL_SERVER,
        });
        return
    }
};