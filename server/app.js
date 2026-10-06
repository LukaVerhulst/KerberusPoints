import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import connectDB from "./configs/db.js";
import authRoutes from "./routes/authRoute.js";
import schachtRoutes from "./routes/schachtRoute.js";
import taskRoutes from "./routes/tasksRoute.js";
import { requireAdmin } from "./middleware/auth.js";
const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
const origins = new Set([
  "https://kerberus-points.vercel.app",
  ...(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
]);
if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
  origins.add("http://localhost:5173");
  origins.add("http://127.0.0.1:5173");
}
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || origins.has(origin)),
    credentials: true,
    allowedHeaders: ["Content-Type", "X-Kerberus-Request"],
  }),
);
app.use(compression());
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("X-Content-Type-Options", "nosniff");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (
      req.headers["x-kerberus-request"] !== "1" ||
      (req.headers.origin && !origins.has(req.headers.origin))
    )
      return res.status(403).json({ message: "Ongeldige verzoekbron." });
    if (req.path !== "/api/auth/login") return requireAdmin(req, res, next);
  }
  next();
});
app.get("/", (req, res) =>
  res.json({ service: "KerberusPoints API", academicYear: "2026-2027" }),
);
app.use("/api/auth", authRoutes);
app.use("/api", async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    res
      .status(503)
      .json({
        message: "Database tijdelijk niet bereikbaar. Probeer opnieuw.",
      });
  }
});
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", database: "connected", academicYear: "2026-2027" }),
);
app.use("/api/schachten", schachtRoutes);
app.use("/api", taskRoutes);
app.use((req, res) =>
  res.status(404).json({ message: "Route niet gevonden." }),
);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  let status = error.status || 500,
    message = error.message;
  if (error.code === 11000) {
    status = 409;
    message =
      "Deze naam of voltooiing bestaat al. De herhaallimiet is bereikt; er zijn geen extra punten toegevoegd.";
  } else if (
    error.name === "CastError" ||
    error.name === "ValidationError" ||
    error.type === "entity.parse.failed"
  ) {
    status = 400;
    message = "Ongeldige invoer.";
  }
  if (status >= 500 && !error.status) {
    message = "De wijziging is niet opgeslagen. Probeer opnieuw.";
    console.error("API failure", error.name, error.code || "");
  }
  res.status(status).json({ message });
});
export default app;
