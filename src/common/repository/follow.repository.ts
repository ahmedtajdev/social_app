import { FollowModel } from "../../DB/models";
import { IFollow } from "../interface";
import { DatabaseRepository } from "./base.repository";

export class FollowRepository extends DatabaseRepository<IFollow> {
  constructor() {
    super(FollowModel);
  }
}

export default new FollowRepository();
