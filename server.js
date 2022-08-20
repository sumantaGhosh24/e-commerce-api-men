import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import fileUpload from "express-fileupload";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import {
  categoryRouter,
  orderRouter,
  paymentRouter,
  productRouter,
  reviewRouter,
  uploadRouter,
  userRouter,
} from "./router/index.js";

dotenv.config();

// declare variable
const app = express();
const PORT = process.env.PORT || 8080;

// setup middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(helmet());
app.use(cors({origin: ["http://localhost:3000", "http://localhost:8080"]}));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(fileUpload({useTempFiles: true}));

// database connection
mongoose.connect(process.env.MONGODB_URL, (err) => {
  if (err) throw err;
  console.log("Database Connection Successful.");
});

// setup routes
app.use("/api", categoryRouter);
app.use("/api", orderRouter);
app.use("/api", paymentRouter);
app.use("/api", productRouter);
app.use("/api", reviewRouter);
app.use("/api", uploadRouter);
app.use("/api", userRouter);

// setup server
app.listen(PORT, () => {
  console.log(`Application Listening on http://localhost:${PORT}`);
});
