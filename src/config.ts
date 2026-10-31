import { resolve } from "node:path";
import { config } from "dotenv";

export const NODE_ENV: string = process.env.NODE_ENV ?? "development";

config({ path: resolve(`.env.${NODE_ENV}`) });

export const PORT: number = parseInt(process.env.PORT ?? "9000");

export const APP_PASSWORD: string = process.env.APP_PASSWORD as string;
export const APP_EMAIL: string = process.env.APP_EMAIL as string;
export const APPLICATION_NAME: string = process.env.APPLICATION_NAME as string;

export const TWITTER: string = process.env.TWITTER as string;
export const INSTAGRAM: string = process.env.INSTAGRAM as string;
export const FACEBOOK: string = process.env.FACEBOOK as string;

export const DB_URI: string = process.env.DB_URI as string;
export const REDIS_URI: string = process.env.REDIS_URI as string;

export const ENC_KEY: string = process.env.ENC_KEY as string;
export const ENC_ALG: string = process.env.ENC_ALG as string;

export const IV_LENGTH: number = parseInt(
  process.env.IV_LENGTH ?? "16",
) as number;

export const ACCESS_USER_TOKEN_SIGNATURE: string = process.env
  .ACCESS_USER_TOKEN_SIGNATURE as string;
export const ACCESS_ADMIN_TOKEN_SIGNATURE: string = process.env
  .ACCESS_ADMIN_TOKEN_SIGNATURE as string;

export const ACCESS_TOKEN_EXPIRES_IN: number = parseInt(
  process.env.ACCESS_TOKEN_EXPIRES_IN ?? "1800",
) as number;

export const REFRESH_USER_TOKEN_SIGNATURE: string = process.env
  .REFRESH_USER_TOKEN_SIGNATURE as string;
export const REFRESH_ADMIN_TOKEN_SIGNATURE: string = process.env
  .REFRESH_ADMIN_TOKEN_SIGNATURE as string;

export const REFRESH_TOKEN_EXPIRES_IN: number = parseInt(
  process.env.REFRESH_TOKEN_EXPIRES_IN ?? "31536000",
) as number;

export const JWT_ISSUER: string = process.env.JWT_ISSUER as string;

export const WEB_CLIENT_IDS: string[] =
  process.env.WEB_CLIENT_IDS?.split(",") || [];

export const ORIGINS: string[] = process.env.ORIGINS?.split(",") || [];
export const ALLOWED_COUNTRIES: string[] =
  process.env.ALLOWED_COUNTRIES?.split(",") || [];
export const LIMIT: number = parseInt(process.env.LIMIT as string) as number;
export const LOGIN_LIMIT: number = parseInt(
  process.env.LOGIN_LIMIT as string,
) as number;
export const BLOCK_IN_SECONDS: number = parseInt(
  process.env.BLOCK_IN_SECONDS as string,
) as number;
