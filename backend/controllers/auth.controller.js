import User from "../models/user.model.js"
import jwt from "jsonwebtoken";
import redis from "../lib/redis.js"

function generateToken(userId) {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m"
    });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d"
    });
    return { accessToken, refreshToken };
};

async function storeRefreshToken(userId, refreshToken) {
    await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 7 * 24 * 60 * 60);
};

function setCookies(res, accessToken, refreshToken) {
    res.cookie("accessToken", accessToken, {
        httpOnly: true, // prevent XSS
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // prevents CSRF attack
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // prevent XSS
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // prevents CSRF attack
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

export async function signup(req, res) {
    const { email, password, name } = req.body;
    try {

        if (!email || !password || !name) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // authenticate
        const user = await User.create({ name, email, password });
        const { accessToken, refreshToken } = generateToken(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            message: "User created successfully"
        });
    } catch (error) {
        console.log("Error @ signup - auth controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export async function login(req, res) {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            const { accessToken, refreshToken } = generateToken(user._id);
            setCookies(res, accessToken, refreshToken);
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            })
        } else {
            return res.status(404).json({ message: "Invalid credentials" });
        }

    } catch (error) {
        console.log("Error @ login - auth controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export async function logout(req, res) {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            await redis.del(`refresh_token:${decoded.userId}`);
        };

        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error @ logout - auth controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};