import Product from "../models/product.model.js";
import redis from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";

const FEATURED_PRODUCTS_KEY="featured_products";

export async function getAllProducts(req, res) {
    try {
        const products = await Product.find({});
        res.json({ products });
    } catch (error) {
        console.log("Error in getAllProducts product controller", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export async function getFeaturedProducts(req, res) {
    try {
        // Check for cache in redis
        let featuredProducts = await redis.get(FEATURED_PRODUCTS_KEY);
        if (featuredProducts) {
            return res.json(JSON.parse(featuredProducts));
        }

        // If not in redis, attempt to get from Mongo DB
        // .lean() is gonna return a plain javascript object insead of mongo db document = better performance
        featuredProducts = await Product.find({ isFeatured: true }).lean();
        if (!featuredProducts) {
            return res.status(404).json({ message: "No featured products found" });
        }

        await redis.set(FEATURED_PRODUCTS_KEY, JSON.stringify(featuredProducts));

        return res.json(featuredProducts);

    } catch (error) {
        console.log("Error in getFeaturedProducts product controller", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export async function createProduct(req, res) {
    try {

        const { name, description, price, image, category } = req.body;

        // Required fields check
        if (!name || !description || !price || !image || !category) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Upload image to cloudinary
        let cloudinaryResponse = null;
        if (image) {
            cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
        }

        // Create Product
        const product = new Product({ name, description, price, image: cloudinaryResponse?.secure_url ?? "", category });
        await product.save();

        // Response
        return res.status(201).json({ message: "Successfully created product" });


    } catch (error) {
        console.log("Error in createProduct product controller", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export async function deleteProduct(req, res) {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.stauts(404).json({ message: "Product not found" });
        }

        if (product.image) {
            const publicId = product.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`products/${publicId}`);
                console.log("Deleted product image from cloudinary");
            } catch (error) {
                console.log("Error deleting image from cloudinary", error.message);
            }
        }

        await Product.findByIdAndDelete(id);

        return res.json({ message: "Product deleted successfully" });

    } catch (error) {
        console.log("Error in deleteProduct product controller", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export async function getRecommendedProducts(req, res) {
    try {

        const products = await Product.aggregate([
            {
                $sample: { size: 3 }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    image: 1,
                    price: 1
                }
            }
        ])

        res.json(products);

    } catch (error) {
        console.log("Error in getRecommendedProducts product controller", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export async function getProductsByCategory(req, res) {
    try {

        const {category} = req.params;

        const products = await Product.find({category});
        res.json(products);

    } catch (error) {
        console.log("Error in getProductsByCategory product controller", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

export async function toggleFeaturedProduct(req,res) {
    try {

        const {id} = req.params;

        const product = await Product.findById(id);
        if (product) {
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            await updateFeaturedProductsCache();
            res.json(updatedProduct);
        } else {
            return res.status(404).json({message: "Product not found"});
        }

    } catch (error) {
        console.log("Error in toggleFeaturedProduct product controller", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

async function updateFeaturedProductsCache() {
    try {
        const featuredProducts = await Product.find({isFeatured:true}).lean();
        await redis.set(FEATURED_PRODUCTS_KEY, JSON.stringify(featuredProducts));
    } catch (error) {
        console.log("Error in updateFeaturedProductsCache product controller", error.message);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}