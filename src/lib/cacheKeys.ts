export const CACHE_KEYS = {
  BRANDS: "brands:all",
  BRAND: (id: string) => `brands:${id}`,
  CATEGORIES: "categories:all",
  CATEGORY: (id: string) => `categories:${id}`,
  PRODUCTS: (query: string) => `products:${query}`,
  PRODUCT: (id: string) => `product:${id}`,
  REVIEWS: (query: string) => `reviews:${query}`,
  PRODUCT_REVIEWS: (productId: string) => `reviews:product:${productId}`,
  USER_REVIEWS: (userId: string) => `reviews:user:${userId}`,
  USER_CART: (userId: string) => `cart:user:${userId}`,
  ORDERS: (query: string) => `orders:${query}`,
  ORDER: (id: string) => `order:${id}`,
  USER_ORDERS: (userId: string, query: string) =>
    `orders:user:${userId}:${query}`,
  ADMIN_DASHBOARD: "dashboard:admin",
  USER_DASHBOARD: (userId: string) => `dashboard:user:${userId}`,
  USERS: (query: string) => `users:${query}`,
};
