import jwt, { JwtPayload } from "jsonwebtoken";
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
import cacheService, { CacheService } from "./cache.service";
import { randomUUID } from "node:crypto";
import { ITokenSignatures } from "../interface";
import { HUser } from "../../DB/models";
import { toObjectId } from "../utils/objectId";
import { LoginResponseType } from "../../modules";
import { userRepository, UserRepository } from "../repository";

export type JwtPayloadType = JwtPayload & {
  sub: string;
  aud: number[];
  jti: string;
  iat: number;
};

export class TokenService {
  private readonly userRepository: UserRepository;
  private readonly cacheService: CacheService;

  constructor() {
    this.userRepository = userRepository;
    this.cacheService = cacheService;
  }

  userBaseKey({ userId }: { userId: string }): string {
    return `User::${userId}`;
  }

  userBaseRevokeTokenKey({ userId }: { userId: string }): string {
    return `${this.userBaseKey({ userId })}::Revoke_Token`;
  }

  userRevokeTokenKey({ userId, jti }: { userId: string; jti: string }): string {
    return `${this.userBaseRevokeTokenKey({ userId })}::${jti}`;
  }

  getTokenSignatures({
    role = RoleEnum.USER,
  }: {
    role: RoleEnum;
  }): ITokenSignatures {
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
  }

  getSignature({
    tokenType = TokenTypeEnum.ACCESS,
    role = RoleEnum.USER,
  }: {
    tokenType: TokenTypeEnum;
    role: RoleEnum;
  }): string {
    const signatures: ITokenSignatures = this.getTokenSignatures({ role });

    switch (tokenType) {
      case TokenTypeEnum.ACCESS:
        return signatures.access_signature;

      case TokenTypeEnum.REFRESH:
        return signatures.refresh_signature;

      default:
        throw new BadRequestException("Invalid token type");
    }
  }

  generateToken({
    payload,
    options,
    secretKey = ACCESS_USER_TOKEN_SIGNATURE,
  }: {
    payload: JwtPayload;
    options?: jwt.SignOptions;
    secretKey: jwt.Secret | jwt.PrivateKey;
  }): string {
    return jwt.sign(payload, secretKey, options);
  }

  verifyToken({
    token,
    secretKey = ACCESS_USER_TOKEN_SIGNATURE,
    options = {},
  }: {
    token: string;
    secretKey: jwt.Secret | jwt.PublicKey;
    options?: jwt.VerifyOptions;
  }): JwtPayloadType {
    try {
      return jwt.verify(token, secretKey, {
        issuer: JWT_ISSUER,
        audience: [RoleEnum.USER.toString(), RoleEnum.ADMIN.toString()],
        ...options,
      }) as JwtPayloadType;
    } catch (error) {
      console.log({ error });
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  async decodeToken({
    token,
    tokenType = TokenTypeEnum.ACCESS,
    role = RoleEnum.USER,
  }: {
    token: string;
    tokenType: TokenTypeEnum;
    role?: RoleEnum;
  }): Promise<{ payload: JwtPayloadType; user: HUser }> {
    const secretKey: string = this.getSignature({
      tokenType,
      role,
    });

    const payload = this.verifyToken({
      token,
      secretKey,
    }) as JwtPayloadType;

    if (!payload.sub) {
      throw new BadRequestException("Missing token payload");
    }

    if (
      await this.cacheService.exists({
        key: this.userRevokeTokenKey({
          userId: payload.sub,
          jti: payload.jti,
        }),
      })
    ) {
      throw new UnauthorizedException("Expired login credentials");
    }

    const user = await this.userRepository.findById({
      id: toObjectId(payload.sub),
    });

    if (!user) {
      throw new NotfoundException("Invalid user");
    }

    if ((user.changeCredentialsTime?.getTime() ?? 0) > payload.iat * 1000) {
      throw new UnauthorizedException("Expired login credentials");
    }

    return { payload, user };
  }

  createLoginCredentials({
    user,
    issuer,
    options = {},
  }: {
    user: HUser;
    issuer: string;
    options?: jwt.SignOptions;
  }): LoginResponseType {
    const { access_signature, refresh_signature } = this.getTokenSignatures({
      role: user.role,
    });
    const jwtid = randomUUID();

    const access_token = this.generateToken({
      payload: { sub: user._id.toHexString(), role: user.role },
      secretKey: access_signature,
      options: {
        ...options,
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
        issuer,
        audience: [user.role?.toString()],
        jwtid,
      },
    });

    const refresh_token = this.generateToken({
      payload: { sub: user._id.toHexString(), role: user.role },
      secretKey: refresh_signature,
      options: {
        ...options,
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        issuer,
        audience: [user.role?.toString()],
        jwtid,
      },
    });

    return { access_token, refresh_token };
  }

  async createRevokeToken({
    payload,
  }: {
    payload: JwtPayloadType;
  }): Promise<void> {
    const consumedTime = Math.ceil(Date.now() / 1000) - payload.iat;
    const refreshExpiresIn = payload.iat + REFRESH_TOKEN_EXPIRES_IN;
    const ttl = refreshExpiresIn - consumedTime;

    // SET IN REDIS
    await this.cacheService.set({
      key: this.userRevokeTokenKey({
        userId: payload.sub,
        jti: payload.jti,
      }),
      value: payload.jti,
      ttl,
    });

    return;
  }
}

export default new TokenService();
