import z from "zod";
import { LanguageEnum } from "../../common/enum";
import {
  booleanFromFormData,
  generalValidationFields,
} from "../../common/utils";

export const createComment = (lang: LanguageEnum = LanguageEnum.EN) =>
  z
    .object({
      body: z.strictObject({
        text: generalValidationFields.text(lang).optional(),
        isAnonymous: booleanFromFormData(lang).optional(),
        post: generalValidationFields.id(lang),
      }),
      files: generalValidationFields.files(lang).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.body.text?.trim() && !data.files?.length) {
        ctx.addIssue({
          code: "custom",
          message:
            lang === LanguageEnum.EN
              ? "Either text or attachments must be provided"
              : "يجب تقديم نص أو مرفقات",
        });
      }
    });

export const getAllPostComments = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    body: z.strictObject({
      post: generalValidationFields.id(lang),
    }),
  });

export const getCommentById = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    body: z.strictObject({
      post: generalValidationFields.id(lang),
    }),
    params: z.strictObject({
      commentId: generalValidationFields.id(lang),
    }),
  });

export const deleteComment = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    params: z.strictObject({
      commentId: generalValidationFields.id(lang),
    }),
  });

export const updateComment = (lang: LanguageEnum = LanguageEnum.EN) =>
  z
    .object({
      params: z.strictObject({
        commentId: generalValidationFields.id(lang),
      }),
      body: z.strictObject({
        text: generalValidationFields.text(lang).optional(),
        isAnonymous: booleanFromFormData(lang).optional(),
      }),
      files: generalValidationFields.files(lang).optional(),
    })
    .superRefine((data, ctx) => {
      if (
        !data.body.text?.trim() &&
        !data.files?.length &&
        data.body.isAnonymous === undefined
      ) {
        ctx.addIssue({
          code: "custom",
          message:
            lang === LanguageEnum.EN
              ? "Either text, attachments or isAnonymous must be provided"
              : "يجب تقديم نص أو مرفقات أو isAnonymous",
        });
      }
    });
