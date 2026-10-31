import { NextFunction, Request, Response } from "express";
import { RoleEnum } from "../common/enum";
import { ForbiddenException } from "../common/exception";

export const authorization = ({
  accessRole = RoleEnum.USER,
}: {
  accessRole: RoleEnum;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if ((req.user.role as RoleEnum) < accessRole) {
      throw new ForbiddenException("Forbidden account");
    }
    next();
  };
};
