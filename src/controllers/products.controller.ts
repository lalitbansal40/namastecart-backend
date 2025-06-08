import { Request, Response } from 'express';
import { ProductModel } from '../models/Product.model';
import mongoose from 'mongoose';
import { CONSTANTS } from '../config/constant';
import { productValidationSchema } from '../validation/product.validation';

export const getProducts = async (req: Request, res: Response) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            inStock,
            minRating,
            tags,
            sortBy,
            sortOrder,
            page = '1',
            limit = '10',
            search,
        } = req.query;

        // Build filter object dynamically
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filters: any = {};

        if (category) {
            if (typeof category === 'string') {
                const categories = category.split(',').map(c => c.trim());
                filters.categories = { $in: categories };
            }
        }

        if (minPrice || maxPrice) {
            filters.price = {};
            if (minPrice) filters.price.$gte = Number(minPrice);
            if (maxPrice) filters.price.$lte = Number(maxPrice);
        }

        if (inStock !== undefined) {
            filters.inStock = inStock === 'true';
        }

        if (minRating) {
            filters.rating = { $gte: Number(minRating) };
        }

        if (tags) {
            const tagsArr = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [];
            if (tagsArr.length > 0) {
                filters.tags = { $in: tagsArr };
            }
        }

        // Search across multiple fields (strings and numbers)
        if (search && typeof search === 'string' && search.trim().length > 0) {
            const searchTerm = search.trim();
            const regex = new RegExp(searchTerm, 'i');
            const searchNumber = Number(searchTerm);
            const isNumber = !isNaN(searchNumber);

            filters.$or = [
                { name: { $regex: regex } },
                { description: { $regex: regex } },
                { brand: { $regex: regex } },
                { categories: { $in: [searchTerm] } },
                { tags: { $in: [searchTerm] } },
                { color: { $regex: regex } },
                ...(isNumber
                    ? [
                        { price: searchNumber },
                        { rating: searchNumber },
                        { numReviews: searchNumber },
                        { stockCount: searchNumber },
                        { totalPurchases: searchNumber },
                        { 'discount.percentage': searchNumber },
                    ]
                    : []),
            ];
        }

        // Pagination
        const pageNumber = parseInt(page as string, 10) || 1;
        const limitNumber = parseInt(limit as string, 10) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        // Sorting
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sortOptions: any = {};
        if (sortBy) {
            const order = sortOrder === 'desc' ? -1 : 1;
            sortOptions[sortBy as string] = order;
        } else {
            sortOptions.createdAt = -1;
        }

        // Fetch filtered data from DB
        const products = await ProductModel.find(filters)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNumber)
            .exec();

        // Count total documents for pagination info
        const totalCount = await ProductModel.countDocuments(filters);

        res.status(CONSTANTS.STATUS_CODES.OK).json({
            success: true,
            page: pageNumber,
            totalPages: Math.ceil(totalCount / limitNumber),
            totalCount,
            products,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: CONSTANTS.ERROR_MESSAGES.INTERNAL_SERVER });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        // Validate if id is a valid ObjectId string
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ success: false, message: CONSTANTS.ERROR_MESSAGES.INVALID_PRODUCT_ID });
            return
        }

        const product = await ProductModel.findById(id).exec();

        if (!product) {
            res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ success: false, message: CONSTANTS.ERROR_MESSAGES.PRODUCT_NOT_FOUND });
            return
        }

        res.status(CONSTANTS.STATUS_CODES.OK).json({ success: true, product });
        return
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: CONSTANTS.ERROR_MESSAGES.INTERNAL_SERVER });
    }
};

export const addProduct = async (req: Request, res: Response) => {
    try {

        const { error, value } = productValidationSchema.validate(req.body, { abortEarly: false });
        if (error) {
            res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({
                success: false,
                message: error.details.map(d => d.message)
            });
            return
        }

        // 3. Check if slug exists
        const existing = await ProductModel.findOne({ slug: value.slug });
        if (existing) {
            res.status(CONSTANTS.STATUS_CODES.BAD_REQUEST).json({ success: false, message: "Product with this slug already exists" });
            return
        }

        // 4. Create product
        const product = new ProductModel(value);
        await product.save();

        res.status(CONSTANTS.STATUS_CODES.CREATED).json({ success: true, message: "Product created", product });
        return
    } catch (error) {
        console.error("Add product error:", error);
        res.status(CONSTANTS.STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal server error" });
        return
    }
};