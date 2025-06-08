import dotenv from 'dotenv';

dotenv.config();

export const CONSTANTS = {
    OTP_EXPIRY_MS: 60 * 1000,
    MESSAGES: {
        OTP_SENT: 'OTP has been sent to your email.',
        OTP_INVALID: 'Invalid or expired OTP.',
        OTP_VERIFIED: 'Email successfully verified!',
    },
    STATUS_CODES: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        INTERNAL_SERVER_ERROR: 500,
    },

    SUCCESS_MESSAGES: {
        USER_REGISTERED: "User registered successfully.",
        USER_LOGGED_IN: "Login successful.",
        PRODUCT_CREATED: "Product created successfully.",
        PRODUCT_UPDATED: "Product updated successfully.",
        PRODUCT_DELETED: "Product deleted successfully.",
        ORDER_PLACED: "Order placed successfully.",
        USER_REGISTERED_VIA_GOOGLE: "User registered via Google"
    },

    ERROR_MESSAGES: {
        VALIDATION_FAILED: "Validation failed. Please check your input.",
        UNAUTHORIZED: "Access denied. Invalid token.",
        FORBIDDEN: "You are not allowed to perform this action.",
        USER_EXISTS: "User with this email or phone already exists.",
        USER_NOT_FOUND: "User not found.",
        INVALID_CREDENTIALS: "Invalid email or password.",
        PRODUCT_NOT_FOUND: "Product not found.",
        ORDER_FAILED: "Failed to place the order.",
        INTERNAL_SERVER: "Something went wrong. Please try again later.",
        USER_NOT_VERIFIED: "User is not verified. Please complete verification to proceed.",
        INVALID_PRODUCT_ID:'Invalid product ID', 
        TOKEN_ID_REQUIRED: "Token ID is required",
        INVALID_GOOGLE_TOKEN: "Invalid Google token",
        EMAIL_NOT_VERIFIED_WITH_GOOGLE: "Email not verified with Google",
        EMAIL_REQUIRED:'Email is required'
       },
    JWT_SECRET: String(process.env.JWT_SECRET),
    DATABASE: {
        MONGO_URI: String(process.env.MONGO_URI)
    },
    EMAIL_CRED: {
        EMAIL: String(process.env.EMAIL),
        EMAIL_PASSWORD: String(process.env.EMAIL_PASSWORD)
    },
    GOOGLE_CRED:{
        GOOGLE_CLIENT_ID:String(process.env.GOOGLE_CLIENT_ID),
        GOOGLE_CLIENT_SECRET:String(process.env.GOOGLE_CLIENT_SECRET)
    },
    RAZORPAY:{
        RAZORPAY_KEY_ID:String(process.env.RAZORPAY_KEY_ID),
        RAZORPAY_KEY_SECRET:String(process.env.RAZORPAY_KEY_SECRET)
    }
};
