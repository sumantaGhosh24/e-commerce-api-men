import {Order} from "../models/index.js";

const paymentCtrl = {
  test: async (req, res) => {
    try {
    } catch (error) {
      return res.status(500).json({msg: error});
    }
  },
};

export default paymentCtrl;
