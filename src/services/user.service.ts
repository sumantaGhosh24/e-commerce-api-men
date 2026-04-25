import bcrypt from "bcryptjs";

import User, { IUser } from "../models/user.model";
import { APIFeatures } from "../utils/pagination";
import redisClient from "../config/redis";
import { CACHE_KEYS } from "../config/cacheKeys";
import logger from "../config/logger";

const CACHE_TTL = 60 * 10;

export const updateUserImageService = async (
  userId: string,
  image: { url: string; public_id: string }
) => {
  try {
    const user = await User.findByIdAndUpdate(userId, { image });
    if (!user) throw new Error("User does not exists.");

    return user;
  } catch (error) {
    logger.error("Error to update user image", error);

    throw error;
  }
};

export const updateUserDataService = async (
  userId: string,
  payload: {
    firstName: string;
    lastName: string;
    username: string;
    dob: string;
    gender: string;
  }
) => {
  try {
    const { firstName, lastName, username, dob, gender } = payload;

    const matchUsername = await User.findOne({ username });
    if (matchUsername) {
      throw new Error("This username already register, try another one.");
    }

    const user = await User.findByIdAndUpdate(userId, {
      firstName: firstName.toLowerCase(),
      lastName: lastName.toLowerCase(),
      username: username.toLowerCase(),
      dob,
      gender: gender.toLowerCase(),
    });
    if (!user) throw new Error("User does not exists.");

    return user;
  } catch (error) {
    logger.error("Error to update user data", error);

    throw error;
  }
};

export const updateUserAddressService = async (
  userId: string,
  payload: {
    city: string;
    state: string;
    country: string;
    zip: string;
    addressline: string;
  }
) => {
  try {
    const { city, state, country, zip, addressline } = payload;

    const user = await User.findByIdAndUpdate(userId, {
      city: city.toLowerCase(),
      state: state.toLowerCase(),
      country: country.toLowerCase(),
      zip,
      addressline: addressline.toLowerCase(),
    });
    if (!user) throw new Error("User does not exists.");

    return user;
  } catch (error) {
    logger.error("Error to update user address", error);

    throw error;
  }
};

export const resetPasswordService = async (
  userId: string,
  previousPassword: string,
  newPassword: string
) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User does not exists.");

    const isMatch = await bcrypt.compare(previousPassword, user.password);
    if (!isMatch) throw new Error("Invalid login credentials.");

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    return user;
  } catch (error) {
    logger.error("Error to reset user password", error);

    throw error;
  }
};

export const deleteUserService = async (userId: string) => {
  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new Error("User does not exists.");

    return user;
  } catch (error) {
    logger.error("Error to delete user", error);

    throw error;
  }
};

export const getUsersService = async (
  query: Record<string, unknown>
): Promise<{ users: IUser[]; count: number }> => {
  try {
    const queryKey = JSON.stringify(query);
    const cacheKey = CACHE_KEYS.USERS(queryKey);

    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const features = new APIFeatures(User.find(), query)
      .paginating()
      .sorting()
      .searching()
      .filtering();
    const features2 = new APIFeatures(User.find(), query)
      .searching()
      .filtering();

    const result = await Promise.allSettled([features.query, features2.query]);

    const users = result[0].status === "fulfilled" ? result[0].value : [];
    const count = result[1].status === "fulfilled" ? result[1].value.length : 0;

    const returnVal = { users, count };

    await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(returnVal));

    return returnVal;
  } catch (error) {
    logger.error("Error to fetch users", error);

    throw error;
  }
};
