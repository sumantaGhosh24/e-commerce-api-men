import {Order} from "../models/index.js";

const paymentCtrl = {
  test: async (req, res) => {
    try {
    } catch (error) {
      return res.status(500).json({msg: error.message});
    }
  },
};

export default paymentCtrl;
