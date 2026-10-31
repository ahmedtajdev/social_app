import mongoose from "mongoose";

export interface IFollow {
  _id: mongoose.Types.ObjectId;
  followerId: mongoose.Types.ObjectId;
  followingId: mongoose.Types.ObjectId;
}
