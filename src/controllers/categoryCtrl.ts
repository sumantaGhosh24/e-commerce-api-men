import {Request, Response} from "express";
import slugify from "slugify";

import Category, {ICategory} from "../models/categoryModel";
import Product from "../models/productModel";
import redisClient from "../lib/redis";
import {CACHE_KEYS} from "../lib/cacheKeys";

const CACHE_TTL = 60 * 10;

function structureCategories(categories: ICategory[], parentId = null): any {
  const categoryList = [];
  let category;
  if (parentId == null) {
    category = categories.filter((cat) => cat.parentId == undefined);
  } else {
    category = categories.filter((cat) => cat.parentId == parentId);
  }
  for (let cat of category) {
    categoryList.push({
      _id: cat._id,
      name: cat.name,
      parentId: cat.parentId,
      image: cat.image,
      children: structureCategories(categories, cat._id as any),
    });
  }
  return categoryList;
}

const categoryCtrl = {
  getCategories: async (req: Request, res: Response) => {
    try {
      const cachedCategories = await redisClient.get(CACHE_KEYS.CATEGORIES);

      if (cachedCategories) {
        res.json(JSON.parse(cachedCategories));
        return;
      }

      const categories = await Category.find();
      const categoryList = structureCategories(categories);

      await redisClient.setEx(
        CACHE_KEYS.CATEGORIES,
        CACHE_TTL,
        JSON.stringify(categoryList)
      );

      res.json(categoryList);
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  createCategory: async (req: Request, res: Response) => {
    try {
      const {name, image, parentId} = req.body;

      if (!name || !image) {
        res.status(400).json({message: "Please fill all fields."});
        return;
      }

      const category = await Category.findOne({name});
      if (category) {
        res.status(400).json({message: "This category already exists."});
        return;
      }

      const slug = slugify(name, {lower: true, trim: true});
      const newCategory = new Category({
        name: name.toLowerCase(),
        slug,
        image,
        parentId,
      });
      await newCategory.save();

      await redisClient.del(CACHE_KEYS.CATEGORIES);

      res.json({message: "Category created successfully."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  getCategory: async (req: Request, res: Response) => {
    try {
      const cacheKey = CACHE_KEYS.CATEGORY(req.params.id);

      const cachedCategory = await redisClient.get(cacheKey);

      if (cachedCategory) {
        res.json(JSON.parse(cachedCategory));
        return;
      }

      const category = await Category.findById(req.params.id);
      if (!category) {
        res.status(400).json({message: "This category does not exists."});
        return;
      }

      await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(category));

      res.json(category);
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },

  updateCategory: async (req: Request, res: Response) => {
    try {
      const {name, image, parentId} = req.body;

      const slug = slugify(name, {lower: true, trim: true});
      const cat: any = {name, image, slug};
      if (parentId !== "") {
        cat.parentId = parentId;
      }

      const category = await Category.findByIdAndUpdate(req.params.id, cat, {
        new: true,
      });
      if (!category) {
        res.status(400).json({message: "This Category Does Not Exists."});
        return;
      }

      await redisClient.del(CACHE_KEYS.CATEGORIES);
      await redisClient.del(CACHE_KEYS.CATEGORY(req.params.id));

      res.json({message: "Category updated successfully."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
  deleteCategory: async (req: Request, res: Response) => {
    try {
      const products = await Product.findOne({category: req.params.id});
      if (products) {
        res.status(400).json({
          message: "Please delete all product of this category first.",
        });
        return;
      }

      const cat = await Category.find({parentId: req.params.id});
      if (cat.length === 1) {
        res
          .status(400)
          .json({message: "Please delete all sub category of this category."});
        return;
      }

      await Category.findByIdAndDelete(req.params.id);

      await redisClient.del(CACHE_KEYS.CATEGORIES);
      await redisClient.del(CACHE_KEYS.CATEGORY(req.params.id));

      res.json({message: "Category Deleted."});
      return;
    } catch (error: any) {
      res.status(500).json({message: error.message});
      return;
    }
  },
};

export default categoryCtrl;
