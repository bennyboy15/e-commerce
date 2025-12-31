import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export function protectRoute(req,res,next) {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({message: "Unauthorised - No access token provided"});
        }

        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const user = User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({message: "User not found"});
        }

        req.user = user;

        next();

    } catch (error) {
        console.log("Error in protectRoute auth middleware", error.message);
        res.status(500).json({message: "Internal Server Error", error: error.message});
    }
}

export function adminRoute(req,res,next) {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({message: "Access denied - admin only"});
    }
}