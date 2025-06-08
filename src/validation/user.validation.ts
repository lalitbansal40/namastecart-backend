import Joi from "joi";

export const userValidationSchema = Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(10).max(15).required(),
    password: Joi.string().min(6).required(), // Should be encrypted before storing
    address: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required(),
        postalCode: Joi.string().required(),
        landmark: Joi.string().optional(),
    }).required(),
    isVerified: Joi.boolean().required(),
    cart: Joi.array().items(Joi.string()).optional(),
}).unknown(false); // ⛔ Disallow unknown fields like `role`

export const loginValidationSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
}).unknown(false);
