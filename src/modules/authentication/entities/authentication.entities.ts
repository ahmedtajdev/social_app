import { idType } from "../../../common/types";

export type LoginResponseType =
  | {
      access_token: string;
      refresh_token: string;
    }
  | undefined;

export type SignupResponseType = {
  _id: idType;
  username: string;
  image: string | null;
};
