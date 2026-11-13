import { NextFunction, Request, Response } from "express";
import { TokenTypeEnum } from "../common/enum";
import { UnauthorizedException } from "../common/exception";
import { tokenService } from "../common/services";

export const tokenAuth = async ({
  req,
  token,
  tokenType = TokenTypeEnum.ACCESS,
}: {
  req: Request;
  token: string;
  tokenType: TokenTypeEnum;
}): Promise<void> => {
  const { payload, user } = await tokenService.decodeToken({
    token,
    tokenType,
  });

  req.payload = payload;
  req.user = user;
};

export const authentication = ({ tokenType = TokenTypeEnum.ACCESS } = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;
    if (!token) {
      throw new UnauthorizedException("Unauthorized user");
    }

    await tokenAuth({ req, token, tokenType });

    next();
  };
};
