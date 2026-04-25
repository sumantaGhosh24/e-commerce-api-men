import { Request } from "express";

import { IUser } from "../models/user.model";

export interface IReqAuth extends Request {
  user?: IUser;
}
