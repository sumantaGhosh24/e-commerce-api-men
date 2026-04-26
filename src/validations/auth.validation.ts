import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().toLowerCase().trim(),
    mobileNumber: z
      .string()
      .min(8)
      .max(15)
      .regex(/^[0-9]+$/, { message: "Mobile number must contain only digits" }),
    password: z.string().min(6).max(128),
    cf_password: z.string().min(6).max(128),
  })
  .refine(data => data.password === data.cf_password, {
    message: "Passwords do not match",
    path: ["cf_password"],
  });

export const loginSchema = z.object({
  email: z.email().toLowerCase().trim(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.email().toLowerCase().trim(),
});

export const confirmForgotPasswordSchema = z
  .object({
    password: z.string().min(6).max(128),
    cf_password: z.string().min(6).max(128),
  })
  .refine(data => data.password === data.cf_password, {
    message: "Passwords do not match",
    path: ["cf_password"],
  });
