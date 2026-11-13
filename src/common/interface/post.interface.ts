import { PostStatusEnum } from "../enum";
import { idType } from "../types";

export interface IPost {
  _id: idType;
  author: idType;
  text?: string;
  attachments?: string[];
  reactionCount: number;
  commentCount: number;
  isAnonymous?: boolean;
  createdAt: Date;
  status?: PostStatusEnum;
}
