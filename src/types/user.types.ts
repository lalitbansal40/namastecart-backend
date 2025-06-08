import { ObjectId } from "mongodb";

export interface IAddress {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    landmark?: string;
}

export interface IUser {
    _id: ObjectId;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    password: string; // encrypted
    address: IAddress;
    cart: { itemId: string, qty: number }[]; // Array of product ObjectIds
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    role: "user" | "admin";
}
