import mongoose from "mongoose";
import {
  AccountPrivacyEnum,
  AccountStatusEnum,
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../enum";
import { idType } from "../types";

export interface IUser {
  _id: idType;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  password: string;
  gender: GenderEnum;
  role: RoleEnum;
  provider?: ProviderEnum;
  status?: AccountStatusEnum;
  changeStatusAt?: Date;
  accountPrivacy?: AccountPrivacyEnum;
  phone?: string;
  DOB?: string;
  confirmEmail?: Date;
  image?: string | null;
  coverImage?: string[];
  changeCredentialsTime?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  isTwoStepVerificationEnabled: Boolean;
  followersCount: number;
  followingCount: number;
}
