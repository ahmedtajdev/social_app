import { NextFunction, Request, Response, Router } from "express";
import {
  authentication,
  authorization,
  responseFormatter,
  validation,
} from "../../middleware";
import { TokenTypeEnum } from "../../common/enum";
import * as validators from "./../authentication/authentication.validation";
import * as userValidators from "./../user/user.validation";
import userService from "./user.service";
import {
  ILoginCredentials,
  IPaginate,
  IResponse,
} from "../../common/interface";
import mongoose from "mongoose";
import { IProfile, IUserPreview } from "./user.interface";

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
    ): Promise<IResponse<IProfile>> => {
      const data = await userService.getMyProfile(req.user);
      return {
        data,
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
    ): Promise<IResponse<IProfile>> => {
      const data = await userService.updateProfile(
        req.user,
        req.validated.body,
      );
      return {
        data,
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

router.get(
  "/search",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(userValidators.search_query),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IPaginate<IUserPreview>>> => {
      const data = await userService.getUserSearchResult({
        user: req.user,
        search_query: req.validated.query.search_query,
      });
      return {
        data,
      };
    },
  ),
);

router.post(
  "/change-account-privacy",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(userValidators.accountPrivacy),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<string>> => {
      const message = await userService.changeAccountPrivacy({
        user: req.user,
        accountPrivacy: req.validated.body.accountPrivacy,
      });
      return {
        message,
      };
    },
  ),
);

router.get(
  "/follow-suggestions",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const data = await userService.getFollowSuggestions({
        user: req.user,
      });
      return {
        data,
      };
    },
  ),
);

router.get(
  "/follow-requests",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const data = await userService.getFollowRequests({
        user: req.user,
      });
      return {
        data,
      };
    },
  ),
);

router.post(
  "/:targetUserId/follow",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.targetUserId),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await userService.follow({
        user: req.user,
        targetUserId: new mongoose.Types.ObjectId(
          req.validated.params.targetUserId,
        ),
      });
      return {
        message,
      };
    },
  ),
);

router.delete(
  "/:targetUserId/follow",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.targetUserId),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await userService.unfollow({
        user: req.user,
        targetUserId: new mongoose.Types.ObjectId(
          req.validated.params.targetUserId,
        ),
      });
      return {
        message,
      };
    },
  ),
);

router.get(
  "/:targetUserId/followers",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.targetUserId),
  authorization(),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IPaginate<IUserPreview>>> => {
      const data = await userService.getUserFollowers({
        user: req.user,
        targetUserId: new mongoose.Types.ObjectId(
          req.validated.params.targetUserId,
        ),
      });
      return {
        data,
      };
    },
  ),
);

router.get(
  "/:targetUserId/following",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.targetUserId),
  authorization(),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IPaginate<IUserPreview>>> => {
      const data = await userService.getUserFollowing({
        user: req.user,
        targetUserId: new mongoose.Types.ObjectId(
          req.validated.params.targetUserId,
        ),
      });
      return {
        data,
      };
    },
  ),
);

router.patch(
  "/follow-requests/:requestId/process",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(userValidators.processFollowRequest),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await userService.processFollowRequests({
        user: req.user,
        requestId: req.validated.params.requestId,
        status: req.validated.body.status,
      });
      return {
        message,
      };
    },
  ),
);

router.delete(
  "/follow-requests/:requestId",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(userValidators.cancelFollowRequest),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await userService.cancelFollowRequest({
        user: req.user,
        requestId: req.validated.params.requestId,
      });
      return {
        message,
      };
    },
  ),
);

router.get(
  "/:profileId",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(userValidators.getUserProfile),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IUserPreview | IProfile>> => {
      const data = await userService.getUserProfile({
        user: req.user,
        profileId: new mongoose.Types.ObjectId(req.validated.params.profileId),
      });
      return {
        data,
      };
    },
  ),
);

router.get(
  "/:profileId",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(userValidators.getUserProfile),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IUserPreview | IProfile>> => {
      const data = await userService.getUserProfile({
        user: req.user,
        profileId: new mongoose.Types.ObjectId(req.validated.params.profileId),
      });
      return {
        data,
      };
    },
  ),
);
export default router;
