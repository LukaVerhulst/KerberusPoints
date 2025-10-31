import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import connectDB from './configs/db.js';
import 'dotenv/config';
import schachtRoutes from './routes/schachtRoute.js';
import authRoutes from './routes/authRoute.js';
import tasksRoutes from './routes/tasksRoute.js';



const app = express();
const port = process.env.PORT || 4000;

// Connect to database - eagerly for local dev, lazily for serverless
// Connection is cached in db.js, so it's safe to call multiple times
if (process.env.VERCEL === '1') {
    // For serverless, connect on first request
    let dbConnected = false;
    const ensureDB = async () => {
        if (!dbConnected) {
            await connectDB();
            dbConnected = true;
        }
    };
    app.use(async (req, res, next) => {
        await ensureDB();
        next();
    });
} else {
    // For local dev, connect eagerly
    await connectDB();
}

// Allow multiple origins
const allowedOrigins = ["http://localhost:5173", "https://kerberus-points.vercel.app"];

// Middleware configuration
app.use(compression()); // Enable gzip compression for faster responses
app.use(express.json({ limit: '10mb' })); // Limit request size
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, credentials: true}));

// Routes
app.use('/api', tasksRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/schachten", schachtRoutes)




app.get("/", (req, res) => res.send("API is working"));

// Export for Vercel serverless functions
export default app;

// Only listen if running locally (not in serverless environment)
if (process.env.VERCEL !== '1') {
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}