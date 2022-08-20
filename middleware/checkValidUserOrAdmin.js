import {User} from "../models/index.js";

const checkValidUserOrAdmin = async (req, res, next) => {
  try {
    const user = await User.findOne({_id: req.user.id});
    if (String(user._id) === req.params.id || user.role === 1) {
      next();
    } else {
      return res.status(400).json({
        msg: "Only owner of this resource and admin can access this resource.",
      });
    }
  } catch (error) {
    return res.status(500).json({msg: error.message});
  }
};

export default checkValidUserOrAdmin;
