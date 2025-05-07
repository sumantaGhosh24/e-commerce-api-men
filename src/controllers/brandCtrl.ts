import {Request, Response} from "express";
import slugify from "slugify";

import Brand from "../models/brandModel";
import Product from "../models/productModel";

const brandCtrl = {
  getBrands: async (req: Request, res: Response) => {
    try {
      const brands = await Brand.find();

      res.json(brands);
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  createBrand: async (req: Request, res: Response) => {
    try {
      const {name, image} = req.body;

      if (!name || !image) {
        res.status(400).json({message: "Please fill all fields."});
        return;
      }

      const brand = await Brand.findOne({name});
      if (brand) {
        res.status(400).json({message: "This brand already exists."});
        return;
      }

      const slug = slugify(name, {lower: true, trim: true});
      const newBrand = new Brand({
        name: name.toLowerCase(),
        slug,
        image,
      });
      await newBrand.save();

      res.json({message: "Brand created successfully."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  getBrand: async (req: Request, res: Response) => {
    try {
      const brand = await Brand.findById(req.params.id);
      if (!brand) {
        res.status(404).json({message: "Brand not found."});
        return;
      }

      res.json(brand);
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  updateBrand: async (req: Request, res: Response) => {
    try {
      const {name, image} = req.body;

      const slug = slugify(name, {lower: true, trim: true});
      const cat = {name, image, slug};

      const brand = await Brand.findByIdAndUpdate(req.params.id, cat, {
        new: true,
      });

      if (!brand) {
        res.status(400).json({message: "This Brand Does Not Exists."});
        return;
      }

      res.json({message: "Brand updated successfully."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  deleteBrand: async (req: Request, res: Response) => {
    try {
      const products = await Product.findOne({brand: req.params.id});
      if (products) {
        res.status(400).json({
          message: "Please delete all product of this brand first.",
        });
        return;
      }

      await Brand.findByIdAndDelete(req.params.id);
      res.json({message: "Brand deleted successfully."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
};

export default brandCtrl;
