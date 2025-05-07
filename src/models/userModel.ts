import mongoose, {Document} from "mongoose";

export interface IUser extends Document {
  _id: string;
  email: string;
  mobileNumber: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  image: {
    url: string;
    public_id: string;
  };
  dob: string;
  gender: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  addressline: string;
  status: "active" | "inactive";
  role: "user" | "admin";
  _doc?: any;
}

const userSchema = new mongoose.Schema(
  {
    email: {type: String, required: true, unique: true},
    mobileNumber: {type: String, required: true, trim: true},
    password: {type: String, required: true},
    firstName: {type: String},
    lastName: {type: String},
    username: {type: String},
    image: {url: String, public_id: String},
    dob: {type: String},
    gender: {type: String},
    city: {type: String},
    state: {type: String},
    country: {type: String},
    zip: {type: String},
    addressline: {type: String},
    status: {type: String, default: "inactive"},
    role: {type: String, default: "user"},
  },
  {timestamps: true}
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
