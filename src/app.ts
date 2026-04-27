import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

import corsOptions from "./config/corsOptions";
import logger from "./config/logger";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import uploadRoutes from "./routes/upload.routes";
import categoryRoutes from "./routes/category.routes";
import brandRoutes from "./routes/brand.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import reviewRoutes from "./routes/review.routes";
import orderRoutes from "./routes/order.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import securityMiddleware from "./middleware/security.middleware";

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cookieParser());
app.use(fileUpload({ useTempFiles: true }));

app.use(
  morgan("combined", {
    stream: { write: message => logger.info(message.trim()) },
  })
);

app.use(securityMiddleware);

app.get("/", (req, res) => {
  logger.info("API Working!");

  res.status(200).send("E-Commerce Website API!");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({ message: "E-Commerce Website API is working!" });
});

app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", uploadRoutes);
app.use("/api", categoryRoutes);
app.use("/api", brandRoutes);
app.use("/api", productRoutes);
app.use("/api", reviewRoutes);
app.use("/api", cartRoutes);
app.use("/api", orderRoutes);
app.use("/api", dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found!" });
});

export default app;
