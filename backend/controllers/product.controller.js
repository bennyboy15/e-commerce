import Product from "../models/product.model.js";

export async function getAllProducts(req,res) {
    try {
        const products = await Product.find({});
        res.json({products});
    } catch (error) {
        console.log("Error in getAllProducts product controller", error.message);
        res.status(500).json({message: "Internal Server Error", error: error.message});
    }
}