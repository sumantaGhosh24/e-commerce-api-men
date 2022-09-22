import shortid from "shortid";
import Razorpay from "razorpay";
import crypto from "crypto";
import fs from "fs";

import dotenv from "dotenv";

dotenv.config();

import {Order} from "../models/index.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const paymentCtrl = {
  logo: async (req, res) => {
    try {
      res.sendFile(path.join(__dirname, "favicon.ico"));
    } catch (error) {
      return res.status(500).json({msg: error.message});
    }
  },
  verification: async (req, res) => {
    try {
      const secret = "123456789";
      const shasum = crypto.createHmac("shad256", secret);
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");
      if (digest === req.headers["x-razorpay-signature"]) {
        fs.writeFileSync("payment.json", JSON.stringify(req.body, null, 4));
      } else {
        // pass it
      }
      res.json({status: "ok"});
    } catch (error) {
      return res.status(500).json({msg: error.message});
    }
  },
  razorPay: async (req, res) => {
    const payment_capture = 1;
    const amount = 500;
    const currency = "INR";
    const options = {
      amount: amount * 100,
      currency,
      receipt: shortid.generate(),
      payment_capture,
    };
    try {
      const response = await razorpay.orders.create(options);
      res.json({
        id: response.id,
        currency: response.currency,
        amount: response.amount,
      });
    } catch (error) {
      return res.status(500).json({msg: error.message});
    }
  },
};

export default paymentCtrl;
