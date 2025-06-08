// controllers/cart.controller.ts

import { Request, Response } from "express";
import mongoose from "mongoose";
import UserModel from "../models/user.model";
import { CONSTANTS } from "../config/constant";
import { IUser } from "../types/user.types";
import { ProductModel } from "../models/Product.model";

export const getCartItems = async (req: Request, res: Response) => {
    try {
        const userDetail = req.user as IUser;
        const userId = userDetail._id;

        const user = await UserModel.findById(userId).select("cart");

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return
        }

        const cart = user.cart || [];

        const itemIds = cart.map((item) => item.itemId);

        const products = await ProductModel.find({ _id: { $in: itemIds } })
            .lean();
        const cartWithDetails = cart.map((cartItem) => {
            const product = products.find(
                (prod) => prod._id.toString() === cartItem.itemId
            );
            return {
                ...cartItem,
                product,
            };
        });

        res.status(200).json({
            success: true,
            message: "Cart items fetched successfully",
            cart: cartWithDetails,
        });
        return
    } catch (err) {
        console.error("Get Cart Items Error:", err);
        res.status(500).json({
            success: false,
            message: CONSTANTS.ERROR_MESSAGES.INTERNAL_SERVER,
        });
        return
    }
};

export const addToCart = async (req: Request, res: Response) => {
    try {
        const userDetail: IUser = req.user as IUser;
        const userId = userDetail._id;
        const { productId, qty = 1 } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            res.status(400).json({ message: "Invalid product ID" });
            return
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return
        }

        const existingItem = user.cart.find((item: { itemId: string, qty: number }) => item.itemId.toString() === productId);

        if (existingItem) {
            existingItem.qty += qty;
        } else {
            user.cart.push({ itemId: productId, qty });
        }

        await user.save();

        res.status(200).json({ message: "Product added to cart", cart: user.cart });
        return
    } catch (err) {
        console.error("Add to Cart Error:", err);
        res.status(500).json({ message: CONSTANTS.ERROR_MESSAGES.INTERNAL_SERVER });
        return
    }
};

export const removeFromCart = async (req: Request, res: Response) => {
    try {
        const userDetail = req.user as IUser;
        const userId = userDetail._id;
        const { productId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            res.status(400).json({ message: "Invalid product ID" });
            return
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return
        }

        // Remove the product from cart
        user.cart = user.cart.filter(
            (item: { itemId: string; qty: number }) => item.itemId !== productId
        );

        await user.save();

        res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart: user.cart,
        });
        return
    } catch (err) {
        console.error("Remove from Cart Error:", err);
        res.status(500).json({
            success: false,
            message: CONSTANTS.ERROR_MESSAGES.INTERNAL_SERVER,
        });
        return
    }
};