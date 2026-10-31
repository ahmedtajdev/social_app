import { HydratedDocument } from "mongoose";
import { IUser } from "../interface";
import { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    validated: any;
    user: HydratedDocument<IUser>;
    payload: JwtPayload;
  }
}
