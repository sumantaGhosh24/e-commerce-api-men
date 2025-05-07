import mongoose, {Document} from "mongoose";

export interface IBrand extends Document {
  name: string;
  slug: string;
  image: {
    public_id: string;
    url: string;
  };
}

const brandSchema = new mongoose.Schema(
  {
    name: {type: String, required: true, trim: true, unique: true},
    slug: {type: String, required: true, unique: true},
    image: {type: Object, required: true},
  },
  {timestamps: true}
);

const Brand = mongoose.model<IBrand>("Brand", brandSchema);

export default Brand;
