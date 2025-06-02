import { Document } from "mongoose";

export interface IDiscount {
    percentage: number;
    active: boolean;
    expiresAt?: Date;
}

export interface IProduct extends Document {
    name: string;
    slug: string;
    description: string;
    price: number;
    currency: string;
    rating: number;
    numReviews: number;
    categories: string[];
    brand: string;
    images: string[];
    inStock: boolean;
    stockCount: number;
    totalPurchases: number;
    color: string;
    size: string[];
    createdAt: Date;
    updatedAt: Date;
    isFeatured: boolean;
    tags: string[];
    discount: IDiscount;
}
