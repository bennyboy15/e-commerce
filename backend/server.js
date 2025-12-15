import express from "express";
import { config } from "dotenv";
import authRoutes from "./routes/auth.routes.js"

config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(PORT, ()=> {
    console.log(`Server running @ PORT ${PORT}`);
})