import { Request, Response } from 'express';
import { ProductModel } from '../models/Product.model';

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
            limit = '10'
        } = req.query;

        // Build filter object dynamically
        const filters: any = {};

        if (category) {
            // Support comma-separated categories or single category
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
            // Query params are strings, convert to boolean
            filters.inStock = inStock === 'true';
        }

        if (minRating) {
            filters.rating = { $gte: Number(minRating) };
        }

        if (tags) {
            // Support comma-separated tags
            const tagsArr = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [];
            if (tagsArr.length > 0) {
                filters.tags = { $in: tagsArr };
            }
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
            // Default sort by createdAt descending
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
            products
        });
        return;
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
