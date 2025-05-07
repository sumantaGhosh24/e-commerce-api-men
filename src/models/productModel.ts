import mongoose, {Document} from "mongoose";

import {IBrand} from "./brandModel";
import {ICategory} from "./categoryModel";
import {IUser} from "./userModel";

export interface IProduct extends Document {
  owner: IUser;
  title: string;
  images: {
    url: string;
    public_id: string;
  }[];
  description: string;
  content: string;
  category: ICategory;
  brand: IBrand;
  price: number;
  checked: boolean;
  stock: number;
  sold: number;
}

const productSchema = new mongoose.Schema(
  {
    owner: {type: mongoose.Schema.Types.ObjectId, required: true, ref: "User"},
    title: {type: String, trim: true, required: true},
    images: [{url: String, public_id: String}],
    description: {type: String, required: true},
    content: {type: String, required: true},
    category: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    brand: {type: mongoose.Schema.Types.ObjectId, required: true, ref: "Brand"},
    price: {type: Number, required: true},
    checked: {type: Boolean, default: false},
    stock: {type: Number, default: 0},
    sold: {type: Number, default: 0},
  },
  {timestamps: true}
);

productSchema.index({
  title: "text",
  description: "text",
  content: "text",
  brand: "text",
  price: "text",
});

const Product = mongoose.model<IProduct>("Product", productSchema);

export default Product;
