import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import 'dotenv/config';
import schachtRoutes from './routes/schachtRoute.js';
import authRoutes from './routes/authRoute.js';
import tasksRoutes from './routes/tasksRoute.js';



const app = express();
const port = process.env.PORT || 4000;

await connectDB();

// Allow multiple origins
const allowedOrigins = ["http://localhost:5173", "https://kerberus-points.vercel.app"];

// Middleware configuration
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, credentials: true}));

// Routes
app.use('/api', tasksRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/schachten", schachtRoutes)




app.get("/", (req, res) => res.send("API is working"));

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})