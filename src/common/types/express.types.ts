import { HydratedDocument } from "mongoose";
import { IUser } from "../interface";
import { JwtPayloadType } from "../services";

declare module "express-serve-static-core" {
  interface Request {
    validated: any;
    user: HydratedDocument<IUser>;
    payload: JwtPayloadType;
  }
}
