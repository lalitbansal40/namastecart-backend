import Joi from "joi";

export const productValidationSchema = Joi.object({
  name: Joi.string().min(1).required(),
  slug: Joi.string().min(1).required(),
  description: Joi.string().min(1).required(),
  price: Joi.number().positive().required(),
  currency: Joi.string().length(3).required(), // e.g. USD, INR
  categories: Joi.array().items(Joi.string()).optional().default([]),
  brand: Joi.string().min(1).required(),
  images: Joi.array().items(Joi.string().uri()).optional().default([]),
  inStock: Joi.boolean().optional().default(true),
  stockCount: Joi.number().integer().min(0).optional().default(0),
  color: Joi.string().optional().allow(""),
  size: Joi.array().items(Joi.string()).optional().default([]),
  isFeatured: Joi.boolean().optional().default(false),
  tags: Joi.array().items(Joi.string()).optional().default([]),
  discount: Joi.object({
    percentage: Joi.number().min(0).max(100).required(),
    active: Joi.boolean().required(),
    expiresAt: Joi.date().optional(),
  }).optional().default({ percentage: 0, active: false }),
});
