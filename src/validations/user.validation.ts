import { z } from "zod";

export const userIdSchema = z.object({ id: z.string().min(1) });

export const userImageSchema = z.object({
  image: z.object({
    url: z.string(),
    public_id: z.string().min(1),
  }),
});

export const userDataSchema = z.object({
  firstName: z.string().min(1).max(255).trim(),
  lastName: z.string().min(1).max(255).trim(),
  username: z.string().min(1).max(255).trim(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date of birth must be in YYYY-MM-DD format",
  }),
  gender: z.enum(["male", "female", "other"]),
});

export const userAddressSchema = z.object({
  city: z.string().min(1).max(255).trim(),
  state: z.string().min(1).max(255).trim(),
  country: z.string().min(1).max(255).trim(),
  zip: z.string().min(1).max(20).trim(),
  addressline: z.string().min(1).max(512).trim(),
});

export const resetPasswordSchema = z
  .object({
    previousPassword: z.string().min(6).max(128),
    newPassword: z.string().min(6).max(128),
    cf_newPassword: z.string().min(6).max(128),
  })
  .refine(data => data.newPassword === data.cf_newPassword, {
    message: "Passwords do not match",
    path: ["cf_newPassword"],
  });
