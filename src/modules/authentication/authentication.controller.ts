import { NextFunction, Request, Response, Router } from "express";
import authenticationService from "./authentication.service";
import { responseFormatter, validation } from "../../middleware";
import { IResponse } from "../../common/interface";
import * as validators from "./authentication.validation";

const router = Router({ strict: true, caseSensitive: true });

router.post(
  "/signup",
  validation(validators.signup),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<number>> => {
      const data = await authenticationService.signup(req.validated.body);
      return {
        status: 201,
        data,
      };
    },
  ),
);

export default router;
