import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);

    await mongoose.connect(process.env.MONGODB_URL!);
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;
