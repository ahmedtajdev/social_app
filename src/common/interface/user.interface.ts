import mongoose from "mongoose";
import {
  AccountPrivacyEnum,
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../enum";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  password: string;
  gender: GenderEnum;
  role?: RoleEnum;
  provider?: ProviderEnum;
  accountPrivacy?: AccountPrivacyEnum;
  phone?: string;
  DOB?: string;
  confirmEmail?: string;
  image?: string | null;
  coverImage?: string[];
  changeCredentialsTime?: string;
  createdAt?: string;
  updatedAt?: string;
  isTwoStepVerificationEnabled: Boolean;
  followersCount: number;
  followingCount: number;
}
