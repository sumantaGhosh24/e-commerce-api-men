import { z } from "zod";

export const productIdSchema = z.object({ id: z.string().min(1) });

export const createProductSchema = z.object({
  title: z.string().min(1).max(150).trim(),
  description: z.string().min(1).max(250).trim(),
  content: z.string().min(1).max(500).trim(),
  category: z.string().min(1),
  brand: z.string().min(1),
  price: z.number().min(0),
  checked: z.boolean(),
  stock: z.number().min(0),
  sold: z.number().min(0),
  images: z
    .array(
      z.object({
        url: z.string(),
        public_id: z.string().min(1),
      })
    )
    .min(1),
});

export const updateProductSchema = z
  .object({
    title: z.string().min(1).max(150).trim().optional(),
    description: z.string().min(1).max(250).trim().optional(),
    content: z.string().min(1).max(500).trim().optional(),
    category: z.string().min(1).optional(),
    brand: z.string().min(1).optional(),
    price: z.number().min(0).optional(),
    checked: z.boolean().optional(),
    stock: z.number().min(0).optional(),
    sold: z.number().min(0).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const addProductImageSchema = z.object({
  images: z.array(
    z.object({
      url: z.string(),
      public_id: z.string().min(1),
    })
  ),
});

export const removeProductImageSchema = z.object({
  public_id: z.string().min(1),
});
