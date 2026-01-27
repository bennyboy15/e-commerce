import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getCartProducts, updateQuantity, addToCart, removeAllFromCart } from "../controllers/cart.controller.js";

const router = express.Router();

router.get("/", protectRoute, getCartProducts);

router.put("/:id", protectRoute, updateQuantity);

router.post("/", protectRoute, addToCart);

router.delete("/", protectRoute, removeAllFromCart);

export default router;