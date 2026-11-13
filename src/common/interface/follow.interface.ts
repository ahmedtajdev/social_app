import { FollowRequestStatusEnum } from "../enum";
import { idType } from "../types";

export interface IFollow {
  _id: idType;
  followerId: idType;
  followingId: idType;
}

export interface IFollowRequest {
  _id: idType;
  senderId: idType;
  receiverId: idType;
  status: FollowRequestStatusEnum;
}
