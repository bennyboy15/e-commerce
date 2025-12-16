import User from "../models/user.model.js"
import jwt from "jsonwebtoken";
import redis from "../lib/redis.js"

function generateToken(userId) {
    const accessToken = jwt.sign({userId}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m"
    });
    const refreshToken = jwt.sign({userId}, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d"
    });
    return {accessToken, refreshToken};
};

async function storeRefreshToken(userId, refreshToken) {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7*24*60*60);
};

function setCookies(res,accessToken,refreshToken) {
    res.cookie("accessToken", accessToken, {
        httpOnly: true, // prevent XSS
        secure: process.env.NODE_ENV==="production",
        sameSite:"strict", // prevents CSRF attack
        maxAge: 15*60*1000 // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // prevent XSS
        secure: process.env.NODE_ENV==="production",
        sameSite:"strict", // prevents CSRF attack
        maxAge: 7*24*60*60*1000 // 7 days
    });
};

export async function signup(req,res){
    const {email, password, name} = req.body;
    try {
    
        if (!email || !password || !name) {
            return res.status(400).json({message: "Missing required fields"});
        }
        if (password.length < 6) {
            return res.status(400).json({message: "Password must be at least 6 characters"});
        }
        const userExists = await User.findOne({email});
        if (userExists) {
            return res.status(400).json({message: "User already exists"});
        }
        
        // authenticate
        const user = await User.create({name, email, password});
        const {accessToken, refreshToken} = generateToken(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res,accessToken,refreshToken);

        res.status(201).json({
            user: {
                _id:user._id,
                name:user.name,
                email:user.email,
                role:user.role
            },
            message: "User created successfully"
        });
    } catch (error) {
        console.log("Error @ signup - auth controller", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
};

export async function login(req,res){
    console.log("login")
};

export async function logout(req,res){
    console.log("logout")
};