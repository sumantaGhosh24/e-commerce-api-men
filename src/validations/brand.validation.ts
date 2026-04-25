import { z } from "zod";

export const brandIdSchema = z.object({ id: z.string().min(1) });

export const createBrandSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  image: z.object({
    url: z.string(),
    public_id: z.string().min(1),
  }),
});

export const updateBrandSchema = z
  .object({
    name: z.string().min(1).max(255).trim(),
    image: z.object({
      url: z.string(),
      public_id: z.string().min(1),
    }),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
