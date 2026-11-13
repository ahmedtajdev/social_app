import { NextFunction, Request, Response, Router } from "express";
import {
  authentication,
  fileUploadMiddleware,
  responseFormatter,
  validation,
} from "../../middleware";
import { fileValidation, localFileUpload } from "../../common/utils";
import * as validators from "./comment.validation";
import { IComment, IPaginate, IResponse } from "../../common/interface";
import commentService from "./comment.service";

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
  validation(validators.createComment),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IComment>> => {
      const data = await commentService.createComment({
        user: req.user,
        post: req.validated.body.post,
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
  validation(validators.getAllPostComments),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IPaginate<IComment>>> => {
      const data = await commentService.getAllPostComments({
        user: req.user,
        post: req.validated.body.post,
      });
      return {
        data,
      };
    },
  ),
);

router.get(
  "/:commentId",
  authentication(),
  validation(validators.getCommentById),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IComment>> => {
      const data = await commentService.getCommentById({
        user: req.user,
        post: req.validated.body.post,
        commentId: req.validated.params.commentId,
      });
      return {
        data,
      };
    },
  ),
);

router.patch(
  "/:commentId",
  authentication(),
  fileUploadMiddleware({
    isFileRequired: false,
    multerMiddleware: localFileUpload({ maxFileSizeMB: 20, files: 5 }).array(
      "attachments",
    ),
    validation: fileValidation.image,
  }),
  validation(validators.updateComment),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse<IComment>> => {
      const data = await commentService.updateComment({
        user: req.user,
        commentId: req.validated.params.commentId,
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
  "/:commentId",
  authentication(),
  validation(validators.deleteComment),
  responseFormatter(
    async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<IResponse> => {
      const message = await commentService.deleteComment({
        user: req.user,
        commentId: req.validated.params.commentId,
      });
      return {
        message,
      };
    },
  ),
);
export default router;
