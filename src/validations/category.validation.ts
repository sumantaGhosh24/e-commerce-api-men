import { z } from "zod";

export const categoryIdSchema = z.object({ id: z.string().min(1) });

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255).trim(),
  image: z.object({
    url: z.string(),
    public_id: z.string().min(1),
  }),
  parentId: z.string().min(1).optional(),
});

export const updateCategorySchema = z
  .object({
    name: z.string().min(1).max(255).trim(),
    image: z.object({
      url: z.string(),
      public_id: z.string().min(1),
    }),
    parentId: z.string().min(1).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
