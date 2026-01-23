import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {createCheckoutSession, checkSessionSuccess} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", protectRoute, createCheckoutSession);
router.post("/checkout-success", protectRoute, checkSessionSuccess)

export default router;