import { ReactionEnum } from "../enum";
import { idType } from "../types";

export interface ICommentReaction {
  _id: idType;
  userId: idType;
  commentId: idType;
  reaction: ReactionEnum;
}
