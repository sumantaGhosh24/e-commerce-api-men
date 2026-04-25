import mongoose from "mongoose";

import app from "./app";
import connectDB from "./config/connectDB";

connectDB();

const PORT = process.env.PORT || 8080;

mongoose.connection.once("open", async () => {
  console.log("Database connection successful!");

  app.listen(PORT, () => {
    console.log(`Application running on http://localhost:${PORT}`);
  });
});

mongoose.connection.on("error", err => {
  console.log(err);
});
