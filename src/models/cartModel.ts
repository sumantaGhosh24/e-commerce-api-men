import mongoose, {Document} from "mongoose";

import {IProduct} from "./productModel";
import {IUser} from "./userModel";

export interface ICart extends Document {
  user: IUser;
  products: {
    product: IProduct;
    quantity: number;
    price: number;
    taxPrice: number;
    shippingPrice: number;
    totalPrice: number;
  }[];
}

const cartSchema = new mongoose.Schema(
  {
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: "User"},
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
        quantity: {type: Number, required: true},
        price: {type: Number, required: true},
        taxPrice: {type: Number, required: true},
        shippingPrice: {type: Number, required: true},
        totalPrice: {type: Number, required: true},
      },
    ],
  },
  {timestamps: true}
);

const Cart = mongoose.model<ICart>("Cart", cartSchema);

export default Cart;
