import { FollowRequestModel } from "../../DB/models";
import { IFollowRequest } from "../interface";
import { DatabaseRepository } from "./base.repository";

export class FollowRequestRepository extends DatabaseRepository<IFollowRequest> {
  constructor() {
    super(FollowRequestModel);
  }
}

export default new FollowRequestRepository();
