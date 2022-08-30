import slugify from "slugify";

import {Brand, Product} from "../models/index.js";

// structure brands function
function structureBrands(brands, parentId = null) {
  const brandList = [];
  let brand;
  if (parentId == null) {
    brand = brands.filter((cat) => cat.parentId == undefined);
  } else {
    brand = brands.filter((cat) => cat.parentId == parentId);
  }
  for (let cat of brand) {
    brandList.push({
      _id: cat._id,
      name: cat.name,
      parentId: cat.parentId,
      image: cat.image,
      createdBy: cat.createdBy,
      children: structureBrands(brands, cat._id),
    });
  }
  return brandList;
}

const brandCtrl = {
  // get brands
  getBrands: async (req, res) => {
    try {
      const brands = await Brand.find().populate(
        "createdBy",
        "_id username email mobileNumber image"
      );
      const brandList = structureBrands(brands);
      res.json({brandList});
    } catch (error) {
      return res.status(500).json({msg: error.message});
    }
  },
  // create brand
  createBrand: async (req, res) => {
    try {
      const {name, image, parentId} = req.body;
      const createdBy = req.user.id;
      const brand = await Brand.findOne({name});
      if (brand)
        return res.status(400).json({msg: "This Brand Already Created."});
      const slug = slugify(name, {lower: true, trim: true});
      const newBrand = new Brand({
        name: name.toLowerCase(),
        slug,
        image,
        parentId,
        createdBy,
      });
      await newBrand.save();
      res.json({msg: "Brand Created."});
    } catch (error) {
      return res.status(500).json({msg: error.message});
    }
  },
  // delete brand
  deleteBrand: async (req, res) => {
    try {
      const products = await Product.findOne({brand: req.params.id});
      if (products)
        return res.status(400).json({
          msg: "Please Delete All Product of this Brand First.",
        });
      const cat = await Brand.find({parentId: req.params.id});
      if (cat.length === 1)
        return res
          .status(400)
          .json({msg: "Please Delete all sub Brand of this Brand."});
      await Brand.findByIdAndDelete(req.params.id);
      res.json({msg: "Brand Deleted."});
    } catch (err) {
      return res.status(500).json({msg: err.message});
    }
  },
  // update brand
  updateBrand: async (req, res) => {
    try {
      const {name, image, parentId} = req.body;
      const slug = slugify(name, {lower: true, trim: true});
      const cat = {name, image, slug};
      if (parentId !== "") {
        cat.parentId = parentId;
      }
      const brand = await Brand.findByIdAndUpdate(req.params.id, cat, {
        new: true,
      });
      if (!brand)
        return res.status(400).json({msg: "This Brand Does Not Exists."});
      return res.status(200).json(brand);
    } catch (error) {
      return res.status(500).json({msg: error.message});
    }
  },
};

export default brandCtrl;
