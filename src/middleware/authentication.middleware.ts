import { NextFunction, Request, Response } from "express";
import { TokenTypeEnum } from "../common/enum";
import { decodeToken } from "../common/security";
import { UnauthorizedException } from "../common/exception";

export const tokenAuth = async ({
  req,
  tokenType = TokenTypeEnum.ACCESS,
}: {
  req: Request;
  tokenType: TokenTypeEnum;
}) => {
  const { payload, user } = await decodeToken({
    token: req.headers.authorization,
    tokenType,
  });

  req.payload = payload;
  req.user = user;
};

export const authentication = ({ tokenType = TokenTypeEnum.ACCESS } = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers.authorization) {
      throw new UnauthorizedException("Unauthorized user");
    }

    await tokenAuth({ req, tokenType });

    next();
  };
};
