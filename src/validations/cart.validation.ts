import { z } from "zod";

export const addCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

export const removeCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});