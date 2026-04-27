import { z } from "zod";

export const orderIdSchema = z.object({ id: z.string().min(1) });

export const orderVerificationSchema = z.object({
  orderCreationId: z.string().min(1, "Order creation id is required"),
  razorpayPaymentId: z.string().min(1, "Razorpay payment id is required"),
  razorpayOrderId: z.string().min(1, "Razorpay order id is required"),
  razorpaySignature: z.string().min(1, "Razorpay signature is required"),
  orderItems: z
    .array(
      z.object({
        product: z.string().min(1, "Product ID is required"),
        quantity: z.number().int().min(1, "Quantity should be at least 1"),
      })
    )
    .min(1, "At least one order item is required"),
  shippingAddress: z.object({
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    pin: z.string().min(1, "ZIP is required"),
    address: z.string().min(1, "Address line is required"),
  }),
  price: z.number().min(0, "Price must be 0 or more"),
  taxPrice: z.number().min(0, "Tax price must be 0 or more"),
  shippingPrice: z.number().min(0, "Shipping price must be 0 or more"),
  totalPrice: z.number().min(0, "Total price must be 0 or more"),
  cartId: z.string().min(1, "Cart ID is required"),
});

export const updateOrderSchema = z
  .object({
    status: z
      .enum(["pending", "processing", "shipped", "delivered", "cancelled"])
      .optional(),
    isDeliverd: z.boolean().optional(),
    deliverAt: z.string().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
