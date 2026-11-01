import { NextFunction, Request, Response, Router } from "express";
import authenticationService from "./authentication.service";
import { responseFormatter, validation } from "../../middleware";
import { ILoginCredentials, IResponse } from "../../common/interface";
import * as validators from "./authentication.validation";
import { generateLimiter } from "../../common/utils";
import { LOGIN_LIMIT } from "../../config";

const router = Router({ strict: true, caseSensitive: true });

router.post(
  "/signup-with-gmail",
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<ILoginCredentials>> => {
      const { status, data } = await authenticationService.signupWithGmail(
        req.body,
      );
      return {
        status,
        data,
      };
    },
  ),
);

router.post(
  "/signup",
  validation(validators.signup),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const { message, user } = await authenticationService.signup(
        req.validated.body,
      );
      return {
        message,
        status: 201,
        data: user,
      };
    },
  ),
);

router.post(
  "/resend-email-otp",
  validation(validators.resendEmailOtp),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await authenticationService.resendEmailOtp({
        email: req.validated.body.email,
        subject: req.validated.body.subject,
        title: req.validated.body.title,
      });
      return {
        message,
      };
    },
  ),
);

router.post(
  "/confirm-email",
  validation(validators.confirmEmail),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await authenticationService.confirmEmail(
        req.validated.body,
      );
      return {
        message,
      };
    },
  ),
);

router.post(
  "/forgot-password",
  validation(validators.forgotPassword),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await authenticationService.forgotPassword(
        req.validated.body,
      );
      return {
        message,
      };
    },
  ),
);

router.post(
  "/verify-forgot-password-code",
  validation(validators.confirmEmail),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const { message } = await authenticationService.verifyForgotPasswordCode(
        req.validated.body,
      );
      return {
        message,
      };
    },
  ),
);

router.patch(
  "/reset-forgot-password",
  validation(validators.resetForgotPassword),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await authenticationService.resetForgotPassword(
        req.validated.body,
      );
      return {
        message,
      };
    },
  ),
);

const loginLimiter = generateLimiter({
  limit: LOGIN_LIMIT,
  ttl: 5 * 60,
  skipSuccessfulRequests: true,
});

router.post(
  "/login",
  loginLimiter,
  validation(validators.login),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<ILoginCredentials>> => {
      const data = (await authenticationService.login(req.validated.body, {
        issuer: `${req.protocol}://${req.host}`,
      })) as ILoginCredentials;
      return {
        data,
      };
    },
  ),
);

router.post(
  "/login-confirmation",
  validation(validators.confirmEmail),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<ILoginCredentials>> => {
      const data = (await authenticationService.loginConfirmation(
        req.validated.body,
        {
          issuer: `${req.protocol}://${req.host}`,
        },
      )) as ILoginCredentials;
      return {
        data,
      };
    },
  ),
);

export default router;
