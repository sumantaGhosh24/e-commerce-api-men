import request from "supertest";

import app from "../src/app";

jest.mock("@arcjet/node", () => ({
  slidingWindow: jest.fn(),
}));
jest.mock("../src/config/arcjet", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));
jest.mock("../src/middleware/security.middleware", () =>
  jest.fn((req, res, next) => next())
);

describe("API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "OK");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
    });
  });

  describe("GET /", () => {
    it("should return message", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.text).toBe("E-Commerce Website API!");
    });
  });

  describe("GET /api", () => {
    it("should return API message", async () => {
      const response = await request(app).get("/api").expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "E-Commerce Website API is working!"
      );
    });
  });

  describe("GET /nonexistent", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/notfound").expect(404);

      expect(response.body).toHaveProperty("error", "Route not found!");
    });
  });
});
