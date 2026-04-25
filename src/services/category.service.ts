import slugify from "slugify";

import Category, { ICategory } from "../models/category.model";
import Product from "../models/product.model";
import redisClient from "../config/redis";
import { CACHE_KEYS } from "../config/cacheKeys";
import logger from "../config/logger";

const CACHE_TTL = 60 * 10;

function structureCategories(
  categories: ICategory[],
  parentId: string | null = null
): object[] {
  const categoryList = [];
  let category;
  if (parentId == null) {
    category = categories.filter(cat => cat.parentId == undefined);
  } else {
    category = categories.filter(cat => cat.parentId == parentId);
  }
  for (const cat of category) {
    categoryList.push({
      _id: cat._id,
      name: cat.name,
      parentId: cat.parentId,
      image: cat.image,
      children: structureCategories(categories, cat._id as string),
    });
  }
  return categoryList;
}

export async function getCategoriesService() {
  try {
    const cachedCategories = await redisClient.get(CACHE_KEYS.CATEGORIES);

    if (cachedCategories) {
      return JSON.parse(cachedCategories);
    }

    const categories = await Category.find();
    const categoryList = structureCategories(categories);

    await redisClient.setEx(
      CACHE_KEYS.CATEGORIES,
      CACHE_TTL,
      JSON.stringify(categoryList)
    );

    return categoryList;
  } catch (error) {
    logger.error("Error to get categories", error);

    throw error;
  }
}

export async function createCategoryService({
  name,
  image,
  parentId,
}: {
  name: string;
  image: { url: string; public_id: string };
  parentId?: string;
}) {
  try {
    const category = await Category.findOne({ name });
    if (category) {
      throw new Error("This category already exists.");
    }

    const slug = slugify(name, { lower: true, trim: true });
    const newCategory = new Category({
      name: name.toLowerCase(),
      slug,
      image,
      parentId,
    });
    await newCategory.save();

    await redisClient.del(CACHE_KEYS.CATEGORIES);

    return category;
  } catch (error) {
    logger.error("Error to create category", error);

    throw error;
  }
}

export async function getCategoryService(id: string) {
  try {
    const cacheKey = CACHE_KEYS.CATEGORY(id);

    const cachedCategory = await redisClient.get(cacheKey);

    if (cachedCategory) {
      return JSON.parse(cachedCategory);
    }

    const category = await Category.findById(id);
    if (!category) {
      throw new Error("This category does not exists.");
    }

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(category));

    return category;
  } catch (error) {
    logger.error("Error get category", error);

    throw error;
  }
}

export async function updateCategoryService(
  id: string,
  {
    name,
    image,
    parentId,
  }: {
    name: string;
    image: { url: string; public_id: string };
    parentId?: string;
  }
) {
  try {
    const slug = slugify(name, { lower: true, trim: true });
    const cat: {
      name: string;
      image: object;
      slug: string;
      parentId?: string;
    } = { name, image, slug };
    if (parentId !== "") {
      cat.parentId = parentId;
    }

    const category = await Category.findByIdAndUpdate(id, cat, {
      new: true,
    });
    if (!category) {
      throw new Error("This Category Does Not Exists.");
    }

    await redisClient.del(CACHE_KEYS.CATEGORIES);
    await redisClient.del(CACHE_KEYS.CATEGORY(id));

    return category;
  } catch (error) {
    logger.error("Error to update category", error);

    throw error;
  }
}

export async function deleteCategoryService(id: string) {
  try {
    const products = await Product.findOne({ category: id });
    if (products) {
      throw new Error("Please delete all product of this category first.");
    }

    const cat = await Category.find({ parentId: id });
    if (cat.length === 1) {
      throw new Error("Please delete all sub category of this category.");
    }

    await Category.findByIdAndDelete(id);

    await redisClient.del(CACHE_KEYS.CATEGORIES);
    await redisClient.del(CACHE_KEYS.CATEGORY(id));

    return cat;
  } catch (error) {
    logger.error("Error to delete category", error);

    throw error;
  }
}
