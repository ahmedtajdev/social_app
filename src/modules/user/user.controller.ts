import { NextFunction, Request, Response, Router } from "express";
import {
  authentication,
  responseFormatter,
  validation,
} from "../../middleware";
import { TokenTypeEnum } from "../../common/enum";
import * as validators from "./../authentication/authentication.validation";
import userService from "./user.service";
import { ILoginCredentials, IResponse, IUser } from "../../common/interface";

const router = Router({ strict: true, caseSensitive: true });

router.patch(
  "/update-password",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.updatePassword),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await userService.updatePassword(
        req.user,
        req.payload,
        req.validated.body,
      );
      return {
        message,
      };
    },
  ),
);

router.get(
  "/",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IUser>> => {
      const data = await userService.getProfile(req.user);
      return {
        data: data as IUser,
      };
    },
  ),
);

router.patch(
  "/",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.updateProfile),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IUser>> => {
      const data = await userService.updateProfile(
        req.user,
        req.validated.body,
      );
      return {
        data: data as IUser,
      };
    },
  ),
);

router.post(
  "/rotate-token",
  authentication({ tokenType: TokenTypeEnum.REFRESH }),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<ILoginCredentials>> => {
      const data = await userService.rotateToken({
        payload: req.payload,
        user: req.user,
        issuer: `${req.protocol}://${req.host}`,
      });
      return {
        data,
      };
    },
  ),
);

router.post(
  "/enable-two-step-verification",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await userService.enableTwoStepVerification(req.user);
      return {
        message,
      };
    },
  ),
);

router.post(
  "/verify-enable-two-step-verification-code",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.otp),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await userService.verifyEnableTwoStepVerificationCode(
        req.user,
        req.validated.body,
      );
      return {
        message,
      };
    },
  ),
);

router.post(
  "/logout",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await userService.logout({
        payload: req.payload,
        user: req.user,
        action: req.body.action,
      });
      return {
        message,
      };
    },
  ),
);

export default router;
