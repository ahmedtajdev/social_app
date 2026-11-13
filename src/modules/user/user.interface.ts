import mongoose from "mongoose";
import { idType } from "../../common/types";

export interface IProfile {
  _id: idType;
  firstName: string;
  lastName: string;
  username?: string | undefined;
  email: string;
  image?: string | null | undefined;
  coverImage?: string[] | undefined;
  phone?: string | null;
  followersCount: number;
  followingCount: number;
}

export interface IUserPreview {
  _id: idType;
  username?: string | undefined;
  image?: string | null | undefined;
  coverImage?: string[] | undefined;
  followersCount?: number;
  followingCount?: number;
}
