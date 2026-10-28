import { NextFunction, Request, Response, Router } from "express";
import authenticationService from "./authentication.service";
import { responseFormatter } from "../../middleware";
import { IResponse } from "../../common/interface";

const router = Router({ strict: true, caseSensitive: true });

router.post(
  "/signup",
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<number>> => {
      const data = await authenticationService.signup(req.body);
      return {
        status: 201,
        data,
      };
    },
  ),
);

export default router;
