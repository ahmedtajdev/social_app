import { NextFunction, Request, Response } from "express";
import { LanguageEnum } from "../common/enum";
import { BadRequestException } from "../common/exception";
import { ZodType } from "zod";

type ValidationSchemaType = (lang?: LanguageEnum) => ZodType;

export const validation = (schema: ValidationSchemaType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const lang = Number(req.headers["accept-language"] ?? LanguageEnum.EN);
    const validationResult = schema(lang).safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!validationResult.success) {
      throw new BadRequestException(
        "Validation error",
        validationResult.error.cause,
      );
    }

    req.validated = validationResult.data;
    next();
  };
};
