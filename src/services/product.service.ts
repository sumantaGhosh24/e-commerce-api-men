import Product, { IProduct } from "../models/product.model";
import { APIFeatures } from "../utils/pagination";
import redisClient from "../config/redis";
import { CACHE_KEYS } from "../config/cacheKeys";
import logger from "../config/logger";

const CACHE_TTL = 60 * 10;

export const getProductsService = async (
  query: Record<string, unknown>
): Promise<{ products: IProduct[]; count: number }> => {
  try {
    const queryKey = JSON.stringify(query);
    const cacheKey = CACHE_KEYS.PRODUCTS(queryKey);

    const cachedProducts = await redisClient.get(cacheKey);
    if (cachedProducts) {
      return JSON.parse(cachedProducts);
    }

    const features = new APIFeatures(
      Product.find()
        .populate("owner", "_id username email mobileNumber image")
        .populate("category", "_id name image"),
      query
    )
      .paginating()
      .sorting()
      .searching()
      .filtering();
    const features2 = new APIFeatures(Product.find(), query)
      .searching()
      .filtering();

    const result = await Promise.allSettled([features.query, features2.query]);

    const products = result[0].status === "fulfilled" ? result[0].value : [];
    const count = result[1].status === "fulfilled" ? result[1].value.length : 0;

    await redisClient.setEx(
      cacheKey,
      CACHE_TTL,
      JSON.stringify({ products, count })
    );

    return { products, count };
  } catch (error) {
    logger.error("Error to get products", error);

    throw error;
  }
};

export const getProductService = async (productId: string) => {
  try {
    const cacheKey = CACHE_KEYS.PRODUCT(productId);

    const cachedProduct = await redisClient.get(cacheKey);
    if (cachedProduct) {
      return JSON.parse(cachedProduct);
    }

    const product = await Product.findById(productId)
      .populate("owner", "_id username email mobileNumber image")
      .populate("category", "_id name image");
    if (!product) return null;

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(product));

    return product;
  } catch (error) {
    logger.error("Error to get product", error);

    throw error;
  }
};

export const createProductService = async (
  data: {
    title: string;
    description: string;
    content: string;
    category: string;
    brand: string;
    price: number;
    checked: boolean;
    stock: number;
    sold: number;
    images: { url: string; public_id: string }[];
  },
  userId: string
) => {
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
      images,
    } = data;

    const newProduct = new Product({
      owner: userId,
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

    const keys = await redisClient.keys("products:*");
    if (keys.length) await redisClient.del(keys);

    return newProduct;
  } catch (error) {
    logger.error("Error to create product", error);

    throw error;
  }
};

export const updateProductService = async (
  productId: string,
  data: {
    title?: string;
    description?: string;
    content?: string;
    category?: string;
    brand?: string;
    price?: number;
    checked?: boolean;
    stock?: number;
    sold?: number;
  }
) => {
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
    } = data;

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product does not exists.");
    }

    if (title) product.title = title.toLowerCase();
    if (description) product.description = description.toLowerCase();
    if (content) product.content = content;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (category) product.category = category as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (brand) product.brand = brand as any;
    if (price) product.price = price;
    if (checked) product.checked = checked;
    if (stock) product.stock = stock;
    if (sold) product.sold = sold;
    await product.save();

    await redisClient.del(CACHE_KEYS.PRODUCT(productId));
    const keys = await redisClient.keys("products:*");
    if (keys.length) await redisClient.del(keys);

    return product;
  } catch (error) {
    logger.error("Error to update category", error);

    throw error;
  }
};

export const addImagesService = async (
  productId: string,
  images: { url: string; public_id: string }[]
) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product does not exists.");
    }

    product.images = [...product.images, ...images];
    await product.save();

    await redisClient.del(CACHE_KEYS.PRODUCT(productId));
    const keys = await redisClient.keys("products:*");
    if (keys.length) await redisClient.del(keys);

    return product;
  } catch (error) {
    logger.error("Error to add product image", error);

    throw error;
  }
};

export const removeImagesService = async (
  productId: string,
  public_id: string
) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product does not exists.");
    }

    product.images = product.images.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (image: any) => image.public_id !== public_id
    );
    await product.save();

    await redisClient.del(CACHE_KEYS.PRODUCT(productId));
    const keys = await redisClient.keys("products:*");
    if (keys.length) await redisClient.del(keys);

    return product;
  } catch (error) {
    logger.error("Error to remove product image", error);

    throw error;
  }
};

export const deleteProductService = async (productId: string) => {
  try {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error("Product does not exists.");
    }

    await Product.findByIdAndDelete(productId);

    await redisClient.del(CACHE_KEYS.PRODUCT(productId));
    const keys = await redisClient.keys("products:*");
    if (keys.length) await redisClient.del(keys);

    return;
  } catch (error) {
    logger.error("Error to delete product", error);

    throw error;
  }
};
