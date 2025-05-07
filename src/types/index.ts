import {Request} from "express";

import {IUser} from "../models/userModel";

export interface IReqAuth extends Request {
  user?: IUser;
}
