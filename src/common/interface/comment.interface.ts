import { CommentStatusEnum } from "../enum";
import { idType } from "../types";

export interface IComment {
  _id: idType;
  author: idType;
  post: idType;
  parentComment?: idType | null;
  text?: string;
  attachments?: string[];
  reactionCount: number;
  repliesCount: number;
  isAnonymous?: boolean;
  status?: CommentStatusEnum;
}
