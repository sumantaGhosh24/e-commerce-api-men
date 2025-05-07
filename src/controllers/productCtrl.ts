import {Request, Response} from "express";

import Product from "../models/productModel";
import {APIFeatures} from "../lib";
import {IReqAuth} from "../types";

const productCtrl = {
  getProducts: async (req: Request, res: Response) => {
    try {
      const features = new APIFeatures(
        Product.find()
          .populate("owner", "_id username email mobileNumber image")
          .populate("category", "_id name image"),
        req.query
      )
        .paginating()
        .sorting()
        .searching()
        .filtering();
      const features2 = new APIFeatures(Product.find(), req.query)
        .searching()
        .filtering();

      const result = await Promise.allSettled([
        features.query,
        features2.query,
      ]);

      const products = result[0].status === "fulfilled" ? result[0].value : [];
      const count =
        result[1].status === "fulfilled" ? result[1].value.length : 0;

      res.status(200).json({products, count});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  getProduct: async (req: Request, res: Response) => {
    try {
      const product = await Product.findById(req.params.id)
        .populate("owner", "_id username email mobileNumber image")
        .populate("category", "_id name image");
      if (!product) {
        res.status(404).json({message: "Product not found."});
        return;
      }

      res.status(200).json(product);
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  createProduct: async (req: IReqAuth, res: Response) => {
    try {
      const owner = req.user?._id;
      const {
        title,
        description,
        content,
        category,
        brand,
        price,
        checked,
        stock,
        sold,
        images,
      } = req.body;

      if (
        !title ||
        !description ||
        !content ||
        !category ||
        !brand ||
        !price ||
        !checked ||
        !stock ||
        !sold ||
        !images
      ) {
        res.status(400).json({message: "Please fill all fields."});
        return;
      }

      const newProduct = new Product({
        owner: owner,
        title: title.toLowerCase(),
        description: description.toLowerCase(),
        content,
        category,
        brand,
        price,
        checked,
        stock,
        sold,
        images,
      });
      await newProduct.save();

      res.json({message: "Product created successfully."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  updateProduct: async (req: Request, res: Response) => {
    try {
      const {
        title,
        description,
        content,
        category,
        brand,
        price,
        checked,
        stock,
        sold,
      } = req.body;

      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(400).json({message: "Product does not exists."});
        return;
      }

      if (title) product.title = title.toLowerCase();
      if (description) product.description = description.toLowerCase();
      if (content) product.content = content;
      if (category) product.category = category;
      if (brand) product.brand = brand;
      if (price) product.price = price;
      if (checked) product.checked = checked;
      if (stock) product.stock = stock;
      if (sold) product.sold = sold;
      await product.save();

      res.json({message: "Product updated successfully."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  addImages: async (req: Request, res: Response) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(400).json({message: "Product does not exists."});
        return;
      }

      product.images = [...product.images, ...req.body.images];
      await product.save();

      res.json({message: "Image added successfully."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  removeImages: async (req: Request, res: Response) => {
    try {
      const {public_id} = req.body;

      if (!public_id) {
        res.status(400).json({message: "Please select an image."});
        return;
      }

      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(400).json({message: "Product does not exists."});
        return;
      }

      product.images = product.images.filter(
        (image) => image.public_id !== public_id
      );
      await product.save();

      res.json({message: "Image removed successfully."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  deleteProduct: async (req: Request, res: Response) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        res.status(400).json({message: "Product does not exists."});
        return;
      }

      await Product.findByIdAndDelete(req.params.id);

      res.json({message: "Product deleted successfully."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
};

export default productCtrl;
