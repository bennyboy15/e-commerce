import express from "express";
import { config } from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import connectDB from "./lib/db.js";
import morgan from "morgan";
import cookieParser from "cookie-parser";

config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.listen(PORT, ()=> {
    console.log(`Server running @ PORT ${PORT}`);
    connectDB();
})