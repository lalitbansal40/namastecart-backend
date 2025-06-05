import { Request, Response } from 'express';
import { ProductModel } from '../models/Product.model';
import mongoose from 'mongoose';

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

        res.json({
            success: true,
            page: pageNumber,
            totalPages: Math.ceil(totalCount / limitNumber),
            totalCount,
            products,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        // Validate if id is a valid ObjectId string
        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: 'Invalid product ID' });
            return
        }

        const product = await ProductModel.findById(id).exec();

        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found' });
            return
        }

        res.json({ success: true, product });
        return
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};