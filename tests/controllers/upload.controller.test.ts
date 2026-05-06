import { Request, Response } from "express";

import * as uploadController from "../../src/controllers/upload.controller";
import * as uploadService from "../../src/services/upload.service";
import * as validations from "../../src/validations/upload.validation";
import * as formatUtils from "../../src/utils/format";

jest.mock("../../src/services/upload.service");
jest.mock("../../src/validations/upload.validation");
jest.mock("../../src/utils/format");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

jest.mock("cloudinary", () => ({
  v2: { config: jest.fn() },
}));

type MockResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

const mockResponse = (): MockResponse => {
  const res = {} as MockResponse;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (data: Partial<Request>): Request =>
  data as unknown as Request;

describe("Upload Controller", () => {
  afterEach(() => jest.clearAllMocks());

  describe("uploadImage", () => {
    it("should upload image successfully", async () => {
      const mockImage = { public_id: "img1", url: "url" };

      jest
        .spyOn(uploadService, "uploadImageService")
        .mockResolvedValue(mockImage);

      const res = mockResponse();

      await uploadController.uploadImage(mockRequest({}), res);

      expect(res.json).toHaveBeenCalledWith(mockImage);
    });

    it("should handle error", async () => {
      jest
        .spyOn(uploadService, "uploadImageService")
        .mockRejectedValue(new Error("fail"));

      const res = mockResponse();

      await uploadController.uploadImage(mockRequest({}), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("uploadImages", () => {
    it("should upload images", async () => {
      const images = [
        { public_id: "1", url: "url1" },
        { public_id: "2", url: "url2" },
      ];

      jest
        .spyOn(uploadService, "uploadImagesService")
        .mockResolvedValue(images);

      const res = mockResponse();

      await uploadController.uploadImages(mockRequest({}), res);

      expect(res.json).toHaveBeenCalledWith(images);
    });

    it("should handle error", async () => {
      jest
        .spyOn(uploadService, "uploadImagesService")
        .mockRejectedValue(new Error("fail"));

      const res = mockResponse();

      await uploadController.uploadImages(mockRequest({}), res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteImage", () => {
    it("should return 400 if validation fails", async () => {
      jest.spyOn(validations.deleteImageSchema, "safeParse").mockReturnValue({
        success: false,
        error: {} as never,
      });

      jest
        .spyOn(formatUtils, "formatValidationError")
        .mockReturnValue("validation error");

      const res = mockResponse();

      await uploadController.deleteImage(mockRequest({ body: {} }), res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should delete image", async () => {
      jest.spyOn(validations.deleteImageSchema, "safeParse").mockReturnValue({
        success: true,
        data: { public_id: "id" },
      });

      jest
        .spyOn(uploadService, "deleteImageService")
        .mockResolvedValue({ message: "Deleted" });

      const res = mockResponse();

      await uploadController.deleteImage(
        mockRequest({ body: { public_id: "id" } }),
        res
      );

      expect(res.json).toHaveBeenCalledWith({ message: "Deleted" });
    });

    it("should handle error", async () => {
      jest.spyOn(validations.deleteImageSchema, "safeParse").mockReturnValue({
        success: true,
        data: { public_id: "id" },
      });

      jest
        .spyOn(uploadService, "deleteImageService")
        .mockRejectedValue(new Error("fail"));

      const res = mockResponse();

      await uploadController.deleteImage(
        mockRequest({ body: { public_id: "id" } }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
