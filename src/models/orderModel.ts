import mongoose, {Document} from "mongoose";

import {IProduct} from "./productModel";
import {IUser} from "./userModel";

export interface IOrder extends Document {
  user: IUser;
  orderItems: {
    product: IProduct;
    quantity: number;
  }[];
  shippingAddress: {
    address: string;
    city: string;
    pin: string;
    country: string;
    state: string;
  };
  paymentResult: {
    id: string;
    status: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };
  price: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isDeliverd: boolean;
  deliverAt: Date;
  status: "pending" | "completed" | "cancelled";
}

const orderSchema = new mongoose.Schema(
  {
    user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: "User"},
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "Product",
        },
        quantity: {type: Number, required: true},
      },
    ],
    shippingAddress: {
      address: {type: String, required: true},
      city: {type: String, required: true},
      pin: {type: String, required: true},
      country: {type: String, required: true},
      state: {type: String, required: true},
    },
    paymentResult: {
      id: {type: String},
      status: {type: String},
      razorpay_order_id: {type: String},
      razorpay_payment_id: {type: String},
      razorpay_signature: {type: String},
    },
    price: {type: Number, required: true, default: 0.0},
    taxPrice: {type: Number, required: true, default: 0.0},
    shippingPrice: {type: Number, required: true, default: 0.0},
    totalPrice: {type: Number, required: true, default: 0.0},
    isDeliverd: {type: Boolean, required: true, default: false},
    deliverAt: {type: Date},
    status: {type: String, default: "pending"},
  },
  {timestamps: true}
);

const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;
