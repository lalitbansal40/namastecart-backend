// models/Product.ts

import mongoose, { Schema } from 'mongoose';
import { IDiscount, IProduct } from '../types/prodcut.types';

const DiscountSchema = new Schema<IDiscount>(
    {
        percentage: { type: Number, required: true },
        active: { type: Boolean, required: true },
        expiresAt: { type: Date }
    },
    { _id: false }
);

const ProductSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        rating: { type: Number, default: 0 },
        numReviews: { type: Number, default: 0 },
        categories: [{ type: String, required: true }],
        brand: { type: String, required: true },
        images: [{ type: String }],
        inStock: { type: Boolean, default: true },
        stockCount: { type: Number, default: 0 },
        totalPurchases: { type: Number, default: 0 },
        color: { type: String },
        size: [{ type: String }],
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        isFeatured: { type: Boolean, default: false },
        tags: [{ type: String }],
        discount: { type: DiscountSchema, required: true }
    },
    { timestamps: true }
);

export const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
