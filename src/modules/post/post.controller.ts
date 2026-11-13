import { NextFunction, Request, Response, Router } from "express";
import {
  authentication,
  fileUploadMiddleware,
  responseFormatter,
  validation,
} from "../../middleware";
import { fileValidation, localFileUpload } from "../../common/utils";
import { IPaginate, IPost, IResponse } from "../../common/interface";
import postService from "./post.service";
import * as validators from "./post.validation";

const router = Router({ strict: true, caseSensitive: true });

router.post(
  "/",
  authentication(),
  fileUploadMiddleware({
    isFileRequired: false,
    multerMiddleware: localFileUpload({ maxFileSizeMB: 20, files: 5 }).array(
      "attachments",
    ),
    validation: fileValidation.image,
  }),
  validation(validators.createNewPost),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IPost>> => {
      const data = await postService.createNewPost({
        user: req.user,
        text: req.validated.body.text,
        isAnonymous: req.validated.body.isAnonymous,
        attachments: req.validated.files,
      });
      return {
        data,
      };
    },
  ),
);

router.get(
  "/",
  authentication(),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IPaginate<IPost>>> => {
      const data = await postService.getAllUserPosts({
        user: req.user,
      });
      return {
        data,
      };
    },
  ),
);

router.get(
  "/:postId",
  authentication(),
  validation(validators.getPostById),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IPost>> => {
      const data = await postService.getPostById({
        user: req.user,
        postId: req.validated.params.postId,
      });
      return {
        data,
      };
    },
  ),
);

router.patch(
  "/:postId",
  authentication(),
  fileUploadMiddleware({
    isFileRequired: false,
    multerMiddleware: localFileUpload({ maxFileSizeMB: 20, files: 5 }).array(
      "attachments",
    ),
    validation: fileValidation.image,
  }),
  validation(validators.updatePost),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IPost>> => {
      const data = await postService.updatePost({
        user: req.user,
        postId: req.validated.params.postId,
        update: {
          ...req.validated.body,
          attachments: req.validated.files,
        },
      });
      return {
        data,
      };
    },
  ),
);

router.delete(
  "/:postId",
  authentication(),
  validation(validators.getPostById),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await postService.deletePost({
        user: req.user,
        postId: req.validated.params.postId,
      });
      return {
        message,
      };
    },
  ),
);

export default router;
