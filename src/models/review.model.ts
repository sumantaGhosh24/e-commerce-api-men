import mongoose, { Document } from "mongoose";

import { IProduct } from "./product.model";
import { IUser } from "./user.model";

export interface IReview extends Document {
  product: IProduct;
  user: IUser;
  comment: string;
  rating: number;
}

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    comment: { type: String, required: true },
    rating: { type: Number, required: true },
  },
  { timestamps: true }
);

const Review = mongoose.model<IReview>("Review", reviewSchema);

export default Review;
