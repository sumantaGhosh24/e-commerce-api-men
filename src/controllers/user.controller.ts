import { Request, Response } from "express";

import { IReqAuth } from "../types";
import {
  resetPasswordSchema,
  userAddressSchema,
  userDataSchema,
  userIdSchema,
  userImageSchema,
} from "../validations/user.validation";
import { formatValidationError } from "../utils/format";
import {
  deleteUserService,
  getUsersService,
  resetPasswordService,
  updateUserAddressService,
  updateUserDataService,
  updateUserImageService,
} from "../services/user.service";
import logger from "../config/logger";

export const userImage = async (req: IReqAuth, res: Response) => {
  try {
    logger.info(`User ${req?.user?._id} image started uploading`);

    const validationResult = userImageSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { image } = validationResult.data;

    await updateUserImageService(req?.user?._id as string, image);

    logger.info(`User ${req?.user?._id} image updated successfully`);

    res.json({ message: "User image updated." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const userData = async (req: IReqAuth, res: Response) => {
  try {
    logger.info(`User ${req?.user?._id} data started updating`);

    const validationResult = userDataSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { firstName, lastName, username, dob, gender } =
      validationResult.data;

    await updateUserDataService(req?.user?._id as string, {
      firstName,
      lastName,
      username,
      dob,
      gender,
    });

    logger.info(`User ${req?.user?._id} data updated successfully`);

    res.json({ message: "User data updated." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const userAddress = async (req: IReqAuth, res: Response) => {
  try {
    logger.info(`User ${req?.user?._id} address started updating`);

    const validationResult = userAddressSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { city, state, country, zip, addressline } = validationResult.data;

    await updateUserAddressService(req?.user?._id as string, {
      city: city.toLowerCase(),
      state: state.toLowerCase(),
      country: country.toLowerCase(),
      zip,
      addressline: addressline.toLowerCase(),
    });

    logger.info(`User ${req?.user?._id} address updated successfully`);

    res.json({ message: "User address updated." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const resetPassword = async (req: IReqAuth, res: Response) => {
  try {
    logger.info(`User ${req?.user?._id} password started resetting`);

    const validationResult = resetPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationResult.error),
      });
      return;
    }

    const { previousPassword, newPassword } = validationResult.data;

    await resetPasswordService(
      req?.user?._id as string,
      previousPassword,
      newPassword
    );

    logger.info(`User ${req?.user?._id} password reset successfully`);

    res.json({ message: "Password reset successfully!" });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    logger.info(`User ${req.params.id} started deleting`);

    const validationParams = userIdSchema.safeParse({ id: req.params.id });

    if (!validationParams.success) {
      res.status(400).json({
        error: "Validation failed",
        message: formatValidationError(validationParams.error),
      });
      return;
    }

    const { id } = validationParams.data;

    await deleteUserService(id);

    logger.info(`User ${id} deleted successfully`);

    res.json({ message: "User Deleted." });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    logger.info("Started fetching users");

    const { users, count } = await getUsersService(req.query);

    logger.info("Successfully fetched users");

    res.status(200).json({ users, count });
    return;
  } catch (error: unknown) {
    res.status(500).json({
      message: error instanceof Error ? error.message : String(error),
    });
    return;
  }
};
