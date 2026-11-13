import z from "zod";
import { LanguageEnum } from "../../common/enum";
import {
  booleanFromFormData,
  generalValidationFields,
} from "../../common/utils";

export const createNewPost = (lang: LanguageEnum = LanguageEnum.EN) =>
  z
    .object({
      body: z.strictObject({
        text: generalValidationFields.text(lang).optional(),
        isAnonymous: booleanFromFormData(lang).optional(),
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

export const updatePost = (lang: LanguageEnum = LanguageEnum.EN) =>
  z
    .object({
      params: z.strictObject({
        postId: generalValidationFields.id(lang),
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

export const getPostById = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    params: z.strictObject({
      postId: generalValidationFields.id(lang),
    }),
  });
