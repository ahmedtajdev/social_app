import mongoose from "mongoose";
import {
  ACCESS_ADMIN_TOKEN_SIGNATURE,
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_USER_TOKEN_SIGNATURE,
  JWT_ISSUER,
  REFRESH_ADMIN_TOKEN_SIGNATURE,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_USER_TOKEN_SIGNATURE,
} from "../../config";
import { RoleEnum, TokenTypeEnum } from "../enum";
import {
  BadRequestException,
  NotfoundException,
  UnauthorizedException,
} from "../exception";
import jwt, { JwtPayload } from "jsonwebtoken";
import { IUser } from "../interface";
import { randomUUID } from "node:crypto";
import { userRepository } from "../repository";
import cacheService from "../services/cache.service";

export const userBaseKey = ({ userId }: { userId: string }): string => {
  return `User::${userId}`;
};

export const userBaseRevokeTokenKey = ({ userId }: { userId: string }) => {
  return `${userBaseKey({ userId })}::Revoke_Token`;
};

export const userRevokeTokenKey = ({
  userId,
  jti,
}: {
  userId: string;
  jti: string;
}) => {
  return `${userBaseRevokeTokenKey({ userId })}::${jti}`;
};

const getTokenSignatures = ({ role = RoleEnum.USER }) => {
  switch (role) {
    case RoleEnum.ADMIN:
      return {
        access_signature: ACCESS_ADMIN_TOKEN_SIGNATURE,
        refresh_signature: REFRESH_ADMIN_TOKEN_SIGNATURE,
      };
    case RoleEnum.USER:
      return {
        access_signature: ACCESS_USER_TOKEN_SIGNATURE,
        refresh_signature: REFRESH_USER_TOKEN_SIGNATURE,
      };

    default:
      throw new BadRequestException("Invalid role");
  }
};

const getSignature = ({
  tokenType = TokenTypeEnum.ACCESS,
  role = RoleEnum.USER,
}: {
  tokenType: TokenTypeEnum;
  role: RoleEnum;
}) => {
  const signatures = getTokenSignatures({ role });

  switch (tokenType) {
    case TokenTypeEnum.ACCESS:
      return signatures.access_signature;

    case TokenTypeEnum.REFRESH:
      return signatures.refresh_signature;

    default:
      throw new BadRequestException("Invalid token type");
  }
};

export const generateToken = ({
  payload,
  options,
  secretKey = ACCESS_USER_TOKEN_SIGNATURE,
}: {
  payload: JwtPayload;
  options: jwt.SignOptions;
  secretKey: jwt.Secret | jwt.PrivateKey;
}) => {
  return jwt.sign(payload, secretKey, options);
};

export const verifyToken = ({
  token,
  secretKey = ACCESS_USER_TOKEN_SIGNATURE,
  options,
}: {
  token: string;
  secretKey: jwt.Secret | jwt.PublicKey;
  options?: jwt.VerifyOptions;
}) => {
  try {
    return jwt.verify(token, secretKey, {
      issuer: JWT_ISSUER,
      audience: [RoleEnum.USER.toString(), RoleEnum.ADMIN.toString()],
      ...(options ? options : {}),
    });
  } catch (error) {
    console.log({ error });
    throw new UnauthorizedException("Invalid or expired token");
  }
};

export const decodeToken = async ({
  token = "",
  tokenType = TokenTypeEnum.ACCESS,
  role = RoleEnum.USER,
} = {}) => {
  const secretKey = getSignature({
    tokenType,
    role,
  });

  const payload = verifyToken({
    token,
    secretKey,
  }) as JwtPayload;

  if (!payload?.sub) {
    throw new BadRequestException("Missing token payload");
  }

  if (
    await cacheService.exists({
      key: userRevokeTokenKey({
        userId: payload.sub,
        jti: payload.jti as string,
      }),
    })
  ) {
    throw new UnauthorizedException("Expired login credentials");
  }

  const user = await userRepository.findById({
    id: new mongoose.Types.ObjectId(payload.sub),
  });

  if (!user) {
    throw new NotfoundException("Invalid user");
  }

  if (
    (new Date(user.changeCredentialsTime as string)?.getTime() ?? 0) >
    (payload.iat as number) * 1000
  ) {
    throw new UnauthorizedException("Expired login credentials");
  }

  return { payload, user };
};

export const createLoginCredentials = async ({
  user,
  issuer = JWT_ISSUER,
  options = {},
}: {
  user: IUser;
  issuer?: string | undefined;
  options?: jwt.SignOptions;
}) => {
  const { access_signature, refresh_signature } = getTokenSignatures({
    role: user.role,
  });
  const jwtid = randomUUID();

  const access_token = generateToken({
    payload: { sub: user._id.toString(), role: user.role },
    secretKey: access_signature,
    options: {
      ...options,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer,
      audience: [user.role?.toString()] as string[],
      jwtid,
    },
  });

  const refresh_token = generateToken({
    payload: { sub: user._id.toString(), role: user.role },
    secretKey: refresh_signature,
    options: {
      ...options,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer,
      audience: [user.role?.toString()] as string[],
      jwtid,
    },
  });

  return { access_token, refresh_token };
};

export const createRevokeToken = async ({
  payload,
}: {
  payload: JwtPayload;
}) => {
  const consumedTime = Math.ceil(Date.now() / 1000) - (payload.iat as number);
  const refreshExpiresIn = (payload.iat as number) + REFRESH_TOKEN_EXPIRES_IN;
  const ttl = refreshExpiresIn - consumedTime;

  // SET IN REDIS
  await cacheService.set({
    key: userRevokeTokenKey({
      userId: payload.sub as string,
      jti: payload.jti as string,
    }),
    value: payload.jti as string,
    ttl,
  });

  return;
};
