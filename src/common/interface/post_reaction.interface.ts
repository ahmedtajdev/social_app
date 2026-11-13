import { ReactionEnum } from "../enum";
import { idType } from "../types";

export interface IPostReaction {
  _id: idType;
  userId: idType;
  postId: idType;
  reaction: ReactionEnum;
}
