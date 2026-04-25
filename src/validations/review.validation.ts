import { z } from "zod";

export const reviewProductSchema = z.object({ product: z.string().min(1) });

export const reviewUserSchema = z.object({ user: z.string().min(1) });

export const createReviewSchema = z.object({
  product: z.string().min(1, "Product ID is required"),
  comment: z.string().min(1, "Comment is required"),
  rating: z.number().min(1).max(5),
});
