import { CommentModel } from "../../DB/models";
import { IComment } from "../interface";
import { DatabaseRepository } from "./base.repository";

export class CommentRepository extends DatabaseRepository<IComment> {
  constructor() {
    super(CommentModel);
  }
}

export default new CommentRepository();
