import mongoose from "mongoose";
import { FollowRequestStatusEnum } from "../enum";

export interface IFollow {
  _id: mongoose.Types.ObjectId;
  followerId: mongoose.Types.ObjectId;
  followingId: mongoose.Types.ObjectId;
}

export interface IFollowRequest {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: FollowRequestStatusEnum;
}
