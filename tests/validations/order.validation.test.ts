import * as orderValidation from "../../src/validations/order.validation";

describe("Order Validation Schemas", () => {
  describe("orderIdSchema", () => {
    it("should pass with valid id", () => {
      const result = orderValidation.orderIdSchema.safeParse({ id: "123" });

      expect(result.success).toBe(true);
    });

    it("should fail if id is empty", () => {
      const result = orderValidation.orderIdSchema.safeParse({ id: "" });

      expect(result.success).toBe(false);
    });

    it("should fail if id is missing", () => {
      const result = orderValidation.orderIdSchema.safeParse({});

      expect(result.success).toBe(false);
    });
  });

  describe("orderVerificationSchema", () => {
    const validData = {
      orderCreationId: "order_1",
      razorpayPaymentId: "pay_1",
      razorpayOrderId: "rzp_1",
      razorpaySignature: "signature",
      orderItems: [{ product: "prod_1", quantity: 1 }],
      shippingAddress: {
        address: "Street 1",
        city: "Kolkata",
        state: "WB",
        country: "India",
        pin: "700001",
      },
      price: 100,
      taxPrice: 10,
      shippingPrice: 5,
      totalPrice: 115,
      cartId: "cart_1",
    };

    it("should pass with valid data", () => {
      const result =
        orderValidation.orderVerificationSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should fail if orderItems is empty", () => {
      const result = orderValidation.orderVerificationSchema.safeParse({
        ...validData,
        orderItems: [],
      });

      expect(result.success).toBe(false);
    });

    it("should fail if quantity < 1", () => {
      const result = orderValidation.orderVerificationSchema.safeParse({
        ...validData,
        orderItems: [{ product: "p1", quantity: 0 }],
      });

      expect(result.success).toBe(false);
    });

    it("should fail if product id missing", () => {
      const result = orderValidation.orderVerificationSchema.safeParse({
        ...validData,
        orderItems: [{ product: "", quantity: 1 }],
      });

      expect(result.success).toBe(false);
    });

    it("should fail if shippingAddress missing fields", () => {
      const result = orderValidation.orderVerificationSchema.safeParse({
        ...validData,
        shippingAddress: {
          address: "",
          city: "",
          state: "",
          country: "",
          pin: "",
        },
      });

      expect(result.success).toBe(false);
    });

    it("should fail if negative price", () => {
      const result = orderValidation.orderVerificationSchema.safeParse({
        ...validData,
        price: -1,
      });

      expect(result.success).toBe(false);
    });

    it("should fail if required field missing", () => {
      const { ...rest } = validData;

      rest.orderCreationId = "";

      const result = orderValidation.orderVerificationSchema.safeParse(rest);

      expect(result.success).toBe(false);
    });

    it("should fail if cartId empty", () => {
      const result = orderValidation.orderVerificationSchema.safeParse({
        ...validData,
        cartId: "",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateOrderSchema", () => {
    it("should pass with status only", () => {
      const result = orderValidation.updateOrderSchema.safeParse({
        status: "shipped",
      });

      expect(result.success).toBe(true);
    });

    it("should pass with isDeliverd only", () => {
      const result = orderValidation.updateOrderSchema.safeParse({
        isDeliverd: true,
      });

      expect(result.success).toBe(true);
    });

    it("should pass with deliverAt only", () => {
      const result = orderValidation.updateOrderSchema.safeParse({
        deliverAt: new Date().toISOString(),
      });

      expect(result.success).toBe(true);
    });

    it("should pass with multiple fields", () => {
      const result = orderValidation.updateOrderSchema.safeParse({
        status: "delivered",
        isDeliverd: true,
      });

      expect(result.success).toBe(true);
    });

    it("should fail if no fields provided", () => {
      const result = orderValidation.updateOrderSchema.safeParse({});

      expect(result.success).toBe(false);
    });

    it("should fail with invalid status", () => {
      const result = orderValidation.updateOrderSchema.safeParse({
        status: "invalid_status",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if isDeliverd is not boolean", () => {
      const result = orderValidation.updateOrderSchema.safeParse({
        isDeliverd: "yes",
      });

      expect(result.success).toBe(false);
    });

    it("should fail if deliverAt is not string", () => {
      const result = orderValidation.updateOrderSchema.safeParse({
        deliverAt: 123,
      });

      expect(result.success).toBe(false);
    });
  });
});
