import { IUser } from "../../common/interface";

export interface ISignup {
  message: string;
  user: Partial<IUser>;
}
