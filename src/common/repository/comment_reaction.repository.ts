import { CommentReactionModel } from "../../DB/models";
import { ICommentReaction } from "../interface";
import { DatabaseRepository } from "./base.repository";

export class CommentReactionRepository extends DatabaseRepository<ICommentReaction> {
  constructor() {
    super(CommentReactionModel);
  }
}

export default new CommentReactionRepository();
