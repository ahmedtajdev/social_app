import mongoose from "mongoose";

export interface IProfile {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  username?: string | undefined;
  email: string;
  image?: string | null | undefined;
  coverImage?: string[] | undefined;
  phone?: string | null;
}

export interface IUserPreview {
  _id: mongoose.Types.ObjectId;
  username?: string | undefined;
  image?: string | null | undefined;
  coverImage?: string[] | undefined;
}
