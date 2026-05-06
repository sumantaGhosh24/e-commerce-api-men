import { Request } from "express";
import fs from "fs";
import cloudinary from "cloudinary";

import * as uploadService from "../../src/services/upload.service";

jest.mock("fs");
jest.mock("cloudinary", () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
    config: jest.fn(),
  },
}));
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

type MockFile = {
  name: string;
  size: number;
  mimetype: string;
  tempFilePath: string;
};

type FileRequest = Pick<Request, "files">;

const createReq = (file: unknown): Request =>
  ({
    files: { file },
  }) as unknown as FileRequest as Request;

describe("Upload Service", () => {
  afterEach(() => jest.clearAllMocks());

  const file: MockFile = {
    name: "test.png",
    size: 1000,
    mimetype: "image/png",
    tempFilePath: "/tmp/file.png",
  };

  describe("removeTmp", () => {
    it("should delete file", () => {
      const unlinkMock = fs.unlink as unknown as jest.Mock;

      unlinkMock.mockImplementation(
        (_path: string, cb: (_err: NodeJS.ErrnoException | null) => void) =>
          cb(null)
      );

      uploadService.removeTmp("/tmp/file.png");

      expect(unlinkMock).toHaveBeenCalled();
    });

    it("should throw if unlink fails", () => {
      const unlinkMock = fs.unlink as unknown as jest.Mock;

      unlinkMock.mockImplementation(
        (_path: string, cb: (_err: NodeJS.ErrnoException | null) => void) =>
          cb(new Error("fail"))
      );

      expect(() => uploadService.removeTmp("/tmp/file.png")).toThrow("fail");
    });
  });

  describe("uploadImageService", () => {
    it("should throw if no file", async () => {
      await expect(
        uploadService.uploadImageService({} as never)
      ).rejects.toBeDefined();
    });

    it("should upload image", async () => {
      const unlinkMock = fs.unlink as unknown as jest.Mock;
      unlinkMock.mockImplementation(
        (_path: string, cb: (_err: NodeJS.ErrnoException | null) => void) =>
          cb(null)
      );
      const uploadMock = cloudinary.v2.uploader.upload as jest.Mock;

      uploadMock.mockImplementation(
        (
          _path: string,
          _opts: unknown,
          cb: (
            _err: Error | null,
            _result?: { public_id: string; secure_url: string }
          ) => void
        ) => {
          cb(null, { public_id: "1", secure_url: "url" });
        }
      );

      const res = await uploadService.uploadImageService(createReq(file));

      expect(res).toEqual({ public_id: "1", url: "url" });
    });

    it("should handle upload error", async () => {
      const unlinkMock = fs.unlink as unknown as jest.Mock;
      unlinkMock.mockImplementation(
        (_path: string, cb: (_err: NodeJS.ErrnoException | null) => void) =>
          cb(null)
      );
      const uploadMock = cloudinary.v2.uploader.upload as jest.Mock;

      uploadMock.mockImplementation(
        (_path: string, _opts: unknown, cb: (_err: Error | null) => void) => {
          cb(new Error("Upload failed"));
        }
      );

      await expect(
        uploadService.uploadImageService(createReq(file))
      ).rejects.toBeDefined();
    });
  });

  describe("uploadImagesService", () => {
    it("should upload multiple images", async () => {
      const unlinkMock = fs.unlink as unknown as jest.Mock;
      unlinkMock.mockImplementation(
        (_path: string, cb: (_err: NodeJS.ErrnoException | null) => void) =>
          cb(null)
      );
      const uploadMock = cloudinary.v2.uploader.upload as jest.Mock;

      uploadMock.mockImplementation(
        (
          _path: string,
          _opts: unknown,
          cb: (
            _err: Error | null,
            _result?: { public_id: string; secure_url: string }
          ) => void
        ) => {
          cb(null, { public_id: "1", secure_url: "url" });
        }
      );

      const res = await uploadService.uploadImagesService(
        createReq([file, file])
      );

      expect(res.length).toBe(2);
    });
  });

  describe("deleteImageService", () => {
    it("should delete image", async () => {
      const destroyMock = cloudinary.v2.uploader.destroy as jest.Mock;

      destroyMock.mockImplementation(
        (_id: string, cb: (_err: Error | null) => void) => cb(null)
      );

      const res = await uploadService.deleteImageService("id");

      expect(res).toEqual({
        message: "Image Deleted Successfully.",
      });
    });

    it("should handle delete error", async () => {
      const destroyMock = cloudinary.v2.uploader.destroy as jest.Mock;

      destroyMock.mockImplementation(
        (_id: string, cb: (_err: Error | null) => void) => cb(new Error("fail"))
      );

      await expect(uploadService.deleteImageService("id")).rejects.toEqual({
        status: 500,
        message: "fail",
      });
    });
  });
});
