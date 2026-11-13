import mongoose from "mongoose";
import { idType } from "../types";

export const toObjectId = (id: string): idType => {
  return mongoose.Types.ObjectId.createFromHexString(id);
};
