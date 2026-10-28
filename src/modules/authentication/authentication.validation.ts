import { z } from "zod";
import { LanguageEnum } from "../../common/enum";
import { generalValidationFields } from "../../common/utils";

const loginSchema = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.strictObject({
    email: generalValidationFields.email(lang),
    password: generalValidationFields.password(lang),
  });

export const login = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    body: loginSchema(lang),
  });

export const signup = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    body: loginSchema(lang)
      .safeExtend({
        username: generalValidationFields.username(lang),
        phone: generalValidationFields.phone(lang),
        confirmPassword: generalValidationFields.password(lang),
      })
      .superRefine((data, ctx) => {
        generalValidationFields.matchFields({
          original: "password",
          copy: "confirmPassword",
          data,
          ctx,
          lang,
        });

        if (!data.username.includes(" ")) {
          ctx.addIssue({
            code: "custom",
            path: ["username"],
            message:
              lang === LanguageEnum.EN
                ? "Username must contain two parts"
                : "يجب أن يحتوي اسم المستخدم على جزأين",
          });
        }
      }),
  });

export const resendEmailOtp = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    body: z.strictObject({
      email: generalValidationFields.email(lang),
    }),
  });

export const forgotPassword = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    body: z.strictObject({
      email: generalValidationFields.email(lang),
    }),
  });

export const confirmEmail = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    body: z.strictObject({
      email: generalValidationFields.email(lang),
      otp: generalValidationFields.otp(lang),
    }),
  });

export const otp = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    body: z.strictObject({
      otp: generalValidationFields.otp(lang),
    }),
  });

export const resetForgotPassword = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    body: z
      .strictObject({
        email: generalValidationFields.email(lang),
        otp: generalValidationFields.otp(lang),
        password: generalValidationFields.password(lang),
        confirmPassword: generalValidationFields.password(lang),
      })
      .superRefine((data, ctx) => {
        generalValidationFields.matchFields({
          original: "password",
          copy: "confirmPassword",
          data,
          ctx,
          lang,
        });
      }),
  });

export const updatePassword = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    body: z
      .strictObject({
        currentPassword: generalValidationFields.password(lang),
        newPassword: generalValidationFields.password(lang),
        confirmNewPassword: generalValidationFields.password(lang),
      })
      .superRefine((data, ctx) => {
        generalValidationFields.NotMatchFields({
          original: "currentPassword",
          copy: "newPassword",
          data,
          ctx,
          lang,
        });
        generalValidationFields.matchFields({
          original: "newPassword",
          copy: "confirmNewPassword",
          data,
          ctx,
          lang,
        });
      }),
  });

export const updateProfile = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    body: z
      .strictObject({
        username: generalValidationFields.username(lang).optional(),
        phone: generalValidationFields.phone(lang).optional(),
        gender: generalValidationFields.gender(lang).optional(),
        firstName: generalValidationFields.firstName(lang).optional(),
        lastName: generalValidationFields.lastName(lang).optional(),
      })
      .superRefine((data, ctx) => {
        if (Object.keys(data).length === 0) {
          ctx.addIssue({
            code: "custom",
            message:
              lang === LanguageEnum.EN
                ? "At least one field is required"
                : "مطلوب حقل واحد على الأقل",
          });
        }
      }),
  });
