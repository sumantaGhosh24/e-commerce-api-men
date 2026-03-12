import {Response} from "express";

import Cart from "../models/cartModel";
import Product from "../models/productModel";
import {IReqAuth} from "../types";
import redisClient from "../lib/redis";
import {CACHE_KEYS} from "../lib/cacheKeys";

const CACHE_TTL = 60 * 10;

const cartCtrl = {
  getCart: async (req: IReqAuth, res: Response) => {
    try {
      const user = req.user?._id as string;

      const cacheKey = CACHE_KEYS.USER_CART(user);

      const cachedCart = await redisClient.get(cacheKey);

      if (cachedCart) {
        res.status(200).json(JSON.parse(cachedCart));
        return;
      }

      const cart = await Cart.findOne({user}).populate("products.product");

      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(cart));

      res.status(200).json(cart);
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  addCart: async (req: IReqAuth, res: Response) => {
    try {
      const user = req.user?._id as string;
      const {productId, quantity} = req.body;

      let cart = await Cart.findOne({user});
      if (cart) {
        let productIndex = cart.products.findIndex(
          (p: any) => p.product == productId
        );

        const product = await Product.findById(productId).select("price");
        if (!product) {
          res.status(400).json({message: "Product not found."});
          return;
        }

        if (productIndex > -1) {
          let productItem = cart.products[productIndex];
          productItem.quantity = quantity;
          productItem.price = parseInt(product.price as any) * quantity;
          productItem.taxPrice = (10 / 100) * productItem.price;
          productItem.shippingPrice = (5 / 100) * productItem.price;
          productItem.totalPrice =
            productItem.price +
            productItem.taxPrice +
            productItem.shippingPrice;
          cart.products[productIndex] = productItem;
        } else {
          let price = parseInt(product.price as any);
          let taxPrice = (10 / 100) * price;
          let shippingPrice = (5 / 100) * price;
          let totalPrice = price + taxPrice + shippingPrice;

          cart.products.push({
            product: productId,
            quantity,
            price,
            taxPrice,
            shippingPrice,
            totalPrice,
          });
        }

        cart = await cart.save();
      } else {
        const product = await Product.findById(productId).select("price");
        if (!product) {
          res.status(400).json({message: "Product not found."});
          return;
        }

        let price = parseInt(product.price as any);
        let taxPrice = (10 / 100) * price;
        let shippingPrice = (5 / 100) * price;
        let totalPrice = price + taxPrice + shippingPrice;

        await Cart.create({
          user,
          products: [
            {
              product: productId,
              quantity,
              price,
              taxPrice,
              shippingPrice,
              totalPrice,
            },
          ],
        });
      }

      await redisClient.del(CACHE_KEYS.USER_CART(user));

      res.json({message: "Product added to cart."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  removeCart: async (req: IReqAuth, res: Response) => {
    try {
      const user = req.user?._id as string;
      const {productId} = req.body;

      let cart = await Cart.findOne({user});
      if (!cart) {
        res.status(400).json({message: "Cart does not exists."});
        return;
      }

      let productIndex = cart.products.findIndex(
        (p: any) => p.product == productId
      );

      if (productIndex > -1) {
        cart.products.splice(productIndex, 1);
      }

      cart = await cart.save();

      await redisClient.del(CACHE_KEYS.USER_CART(user));

      res.json({message: "Product removed from cart."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  clearCart: async (req: IReqAuth, res: Response) => {
    try {
      const user = req.user?._id as string;

      await Cart.findOneAndDelete({user});

      await redisClient.del(CACHE_KEYS.USER_CART(user));

      res.json({message: "Cart cleared."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
};

export default cartCtrl;
