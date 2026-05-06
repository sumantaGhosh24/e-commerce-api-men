import request from "supertest";

import app from "../../src/app";
import * as uploadService from "../../src/services/upload.service";

jest.mock("@arcjet/node", () => ({
  slidingWindow: jest.fn(),
}));
jest.mock("../../src/config/arcjet", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../src/middleware/security.middleware", () =>
  jest.fn((req, res, next) => next())
);
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
jest.mock("../../src/middleware/auth.middleware", () =>
  jest.fn((req, _res, next) => {
    req.user = { _id: "user123", role: "user" };
    next();
  })
);
jest.mock("../../src/middleware/admin.middleware", () =>
  jest.fn((req, _res, next) => {
    req.user = { _id: "admin123", role: "admin" };
    next();
  })
);
jest.mock("../../src/services/upload.service");

describe("Upload Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/upload", () => {
    it("should upload file successfully (auth)", async () => {
      (uploadService.uploadImageService as jest.Mock).mockResolvedValue({
        url: "image-url",
        public_id: "img123",
      });

      const res = await request(app)
        .post("/api/upload")
        .attach("file", Buffer.from("test"), "test.png")
        .expect(200);

      expect(res.body).toHaveProperty("url");
      expect(uploadService.uploadImageService).toHaveBeenCalled();
    });
  });

  describe("POST /api/uploads", () => {
    it("should upload multiple files successfully (admin)", async () => {
      (uploadService.uploadImagesService as jest.Mock).mockResolvedValue([
        { url: "img1", public_id: "1" },
        { url: "img2", public_id: "2" },
      ]);

      const res = await request(app)
        .post("/api/uploads")
        .attach("files", Buffer.from("test1"), "test1.png")
        .attach("files", Buffer.from("test2"), "test2.png")
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(uploadService.uploadImagesService).toHaveBeenCalled();
    });
  });

  describe("POST /api/destroy", () => {
    it("should delete image successfully", async () => {
      (uploadService.deleteImageService as jest.Mock).mockResolvedValue({
        message: "deleted",
      });

      const res = await request(app)
        .post("/api/destroy")
        .send({ public_id: "img123" })
        .expect(200);

      expect(res.body).toHaveProperty("message", "deleted");
      expect(uploadService.deleteImageService).toHaveBeenCalledWith("img123");
    });

    it("should return 400 if public_id missing", async () => {
      const res = await request(app).post("/api/destroy").send({}).expect(400);

      expect(res.body).toHaveProperty("message");
    });
  });
});
