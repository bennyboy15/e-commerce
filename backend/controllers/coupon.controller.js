import Coupon from "../models/coupon.model.js";

export async function getCoupon(req,res) {
    try {
        const coupon = await Coupon.find({userId:req.user._id, isActive:true});
        return res.json(coupon || null);
    } catch (error) {
        console.log("Error in getCoupon function @ coupon controller");
        return res.status(500).json({message: "Internal Server Error"});
    }
}

export async function validateCoupon(req,res) {
    try {
        const {code} = req.body;
        const coupon = await Coupon.findOne({code:code, userId:req.user._id, isActive:true});

        // If coupon not found
        if (!coupon) return res.status(404).json({message: "Coupon not found"});

        // If coupon is expired
        if (coupon.expirationDate < new Date()) {
            coupon.isActive=false;
            await coupon.save();
            return res.status(400).json({message: "Coupon expired"});
        }

        return res.json({
            message:"Coupon is valid", 
            code:coupon.code, 
            discountPercentage:coupon.discountPercentage}
        );

    } catch (error) {
        console.log("Error in validateCoupon function @ coupon controller");
        return res.status(500).json({message: "Internal Server Error"});
    }
}