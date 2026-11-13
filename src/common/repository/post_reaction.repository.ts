import { PostReactionModel } from "../../DB/models";
import { IPostReaction } from "../interface";
import { DatabaseRepository } from "./base.repository";

export class PostReactionRepository extends DatabaseRepository<IPostReaction> {
  constructor() {
    super(PostReactionModel);
  }
}

export default new PostReactionRepository();
