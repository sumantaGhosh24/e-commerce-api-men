import slugify from "slugify";

import Brand from "../models/brand.model";
import Product from "../models/product.model";
import redisClient from "../config/redis";
import { CACHE_KEYS } from "../config/cacheKeys";
import logger from "../config/logger";

const CACHE_TTL = 60 * 10;

export const getBrandsService = async () => {
  try {
    const cachedBrands = await redisClient.get(CACHE_KEYS.BRANDS);

    if (cachedBrands) {
      return JSON.parse(cachedBrands);
    }

    const brands = await Brand.find();

    await redisClient.setEx(
      CACHE_KEYS.BRANDS,
      CACHE_TTL,
      JSON.stringify(brands)
    );

    return brands;
  } catch (error) {
    logger.error("Error to get brands", error);

    throw error;
  }
};

export const createBrandService = async (
  name: string,
  image: { url: string; public_id: string }
) => {
  try {
    const brand = await Brand.findOne({ name });
    if (brand) {
      throw new Error("This brand already exists.");
    }

    const slug = slugify(name, { lower: true, trim: true });
    const newBrand = new Brand({
      name: name.toLowerCase(),
      slug,
      image,
    });
    await newBrand.save();

    await redisClient.del(CACHE_KEYS.BRANDS);

    return newBrand;
  } catch (error) {
    logger.error("Error to create brand", error);

    throw error;
  }
};

export const getBrandService = async (id: string) => {
  try {
    const cacheKey = CACHE_KEYS.BRAND(id);

    const cachedBrand = await redisClient.get(cacheKey);

    if (cachedBrand) {
      return JSON.parse(cachedBrand);
    }

    const brand = await Brand.findById(id);
    if (!brand) {
      throw new Error("Brand not found.");
    }

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(brand));

    return brand;
  } catch (error) {
    logger.error("Error get brand", error);

    throw error;
  }
};

export const updateBrandService = async (
  id: string,
  name: string,
  image: { url: string; public_id: string }
) => {
  try {
    const slug = slugify(name, { lower: true, trim: true });
    const cat = { name, image, slug };

    const brand = await Brand.findByIdAndUpdate(id, cat, {
      new: true,
    });

    if (!brand) {
      throw new Error("This Brand Does Not Exists.");
    }

    await redisClient.del(CACHE_KEYS.BRANDS);
    await redisClient.del(CACHE_KEYS.BRAND(id));

    return brand;
  } catch (error) {
    logger.error("Error to update brand", error);

    throw error;
  }
};

export const deleteBrandService = async (id: string) => {
  try {
    const products = await Product.findOne({ brand: id });
    if (products) {
      throw new Error("Please delete all product of this brand first.");
    }

    const brand = await Brand.findByIdAndDelete(id);

    await redisClient.del(CACHE_KEYS.BRANDS);
    await redisClient.del(CACHE_KEYS.BRAND(id));

    return brand;
  } catch (error) {
    logger.error("Error to delete brand", error);

    throw error;
  }
};
