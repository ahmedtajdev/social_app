import mongoose from "mongoose";
import { DB_URI } from "../config";
import { Application } from "express";
import { connectRedis } from "./redis.connection";

// DB CONNECTION
export const bootstrapDB = async (app: Application, port: number) => {
  try {
    await mongoose.connect(DB_URI);
    console.log(`DB connected successfully`);
    await connectRedis();
    app.listen(port, () => console.log(`App is running on port ${port}`));
  } catch (error) {
    console.log(error);

    console.log(`Fail to connect on DB`);
  }
};
