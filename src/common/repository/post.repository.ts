import { PostModel } from "../../DB/models";
import { IPost } from "../interface";
import { DatabaseRepository } from "./base.repository";

export class PostRepository extends DatabaseRepository<IPost> {
  constructor() {
    super(PostModel);
  }
}

export default new PostRepository();
