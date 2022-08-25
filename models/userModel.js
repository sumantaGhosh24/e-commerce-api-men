import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },

    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
    },
    image: {
      type: Object,
      default:
        "https://res.cloudinary.com/dzqgzsnoc/image/upload/v1661089281/e-commerce-api-men/z3c01tgtolouzyvccvmj.jpg",
    },
    dob: {
      type: String,
    },
    gender: {
      type: String,
    },
    twoStepVerification: {
      type: Number,
      default: 0,
    },

    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    zip: {
      type: Number,
      trim: true,
    },
    addressline1: {
      type: String,
      trim: true,
    },
    addressline2: {
      type: String,
      trim: true,
    },

    cart: {
      type: Array,
      product: {type: mongoose.Schema.Types.ObjectId, ref: "Product"},
      quantity: {type: Number},
    },
    status: {
      type: String,
      default: "inactive",
    },
    role: {
      type: Number,
      default: 0,
    },
    root: {
      type: Number,
      default: 0,
    },
  },
  {timestamp: true}
);

userSchema.index({
  email: "text",
  mobileNumber: "text",
  username: "text",
  firstName: "text",
  lastName: "text",
});

const User = mongoose.model("User", userSchema);

User.createIndexes({
  email: "text",
  mobileNumber: "text",
  username: "text",
  firstName: "text",
  lastName: "text",
});

export default User;
