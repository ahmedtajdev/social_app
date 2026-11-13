import { NextFunction, Request, RequestHandler, Response } from "express";
import { BadRequestException } from "../common/exception";
import { processMulterUpload } from "../common/utils";

export const fileUploadMiddleware = ({
  isFileRequired = true,
  multerMiddleware,
  customPath = "general",
  validation,
}: {
  isFileRequired?: boolean;
  multerMiddleware: RequestHandler;
  customPath?: string;
  validation: string[];
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, async (error) => {
      try {
        if (error) {
          throw new BadRequestException(error.message);
        }

        if (
          isFileRequired &&
          !(
            req.file ||
            (Array.isArray(req.files) && req.files.length) ||
            (typeof req.files === "object" && Object.keys(req.files).length)
          )
        ) {
          throw new BadRequestException("File is required");
        }

        await processMulterUpload({
          req,
          isFileRequired,
          customPath,
          validation,
        });

        next();
      } catch (error) {
        next(error);
      }
    });
  };
};
