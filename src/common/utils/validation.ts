import { z } from "zod";
import mongoose from "mongoose";
import {
  AccountPrivacyEnum,
  EmailSubjectEnum,
  EmailTitleEnum,
  GenderEnum,
  LanguageEnum,
  ProcessFollowRequestStatusEnum,
} from "../enum";

const validationMessages = {
  email: {
    [LanguageEnum.EN]:
      "Invalid email format, please add valid email like any@example.com",
    [LanguageEnum.AR]:
      "تنسيق البريد الإلكتروني غير صحيح، يرجى إضافة بريد إلكتروني صحيح مثل any@example.com",
  },
  phone: {
    [LanguageEnum.EN]: "Please enter a valid Egyptian phone number",
    [LanguageEnum.AR]: "الرجاء إدخال رقم هاتف مصري صالح",
  },
  password: {
    [LanguageEnum.EN]:
      "Password must contain at least one letter and one number, and be between 8 and 16 characters long",
    [LanguageEnum.AR]:
      "يجب أن تحتوي كلمة المرور على حرف واحد ورقم واحد، وأن تكون بين 8 و16 حرفًا",
  },
  username: {
    [LanguageEnum.EN]: "Username must contain two parts",
    [LanguageEnum.AR]: "يجب أن يحتوي اسم المستخدم على جزأين",
  },
  firstName: {
    [LanguageEnum.EN]: "Please enter a valid first name",
    [LanguageEnum.AR]: "الرجاء إدخال اسم أول صالح",
  },
  lastName: {
    [LanguageEnum.EN]: "Please enter a valid last name",
    [LanguageEnum.AR]: "الرجاء إدخال اسم عائلة صالح",
  },
  otp: {
    [LanguageEnum.EN]: "OTP must be a 6-digit number",
    [LanguageEnum.AR]: "يجب أن يكون OTP رقمًا مكونًا من 6 أرقام",
  },
  id: {
    [LanguageEnum.EN]: "Invalid ID format",
    [LanguageEnum.AR]: "تنسيق ID غير صحيح",
  },
  subject: {
    [LanguageEnum.EN]:
      "Invalid subject, must be one of the predefined subjects",
    [LanguageEnum.AR]:
      "موضوع غير صالح، يجب أن يكون أحد المواضيع المحددة مسبقًا",
  },
  title: {
    [LanguageEnum.EN]: "Invalid title, must be one of the predefined titles",
    [LanguageEnum.AR]:
      "عنوان غير صالح، يجب أن يكون أحد العناوين المحددة مسبقًا",
  },
  search_query: {
    [LanguageEnum.EN]: "Invalid search query",
    [LanguageEnum.AR]: "طلب بحث غير صالح",
  },
};

const getValidationMessage = (
  field: keyof typeof validationMessages,
  lang: LanguageEnum = LanguageEnum.EN,
): string => {
  return validationMessages[field]?.[lang] || "Invalid input";
};

const matchFields = <T extends object>({
  original,
  copy,
  data,
  ctx,
  lang = LanguageEnum.EN,
}: {
  original: Extract<keyof T, string>;
  copy: Extract<keyof T, string>;
  data: T;
  ctx: z.RefinementCtx;
  lang?: LanguageEnum;
}) => {
  if (data[original] !== data[copy]) {
    ctx.addIssue({
      code: "custom",
      path: [copy],
      message:
        lang === LanguageEnum.EN
          ? `${copy} must match ${original}`
          : `${copy} يجب أن يطابق ${original}`,
    });
  }
};

const NotMatchFields = <T extends object>({
  original,
  copy,
  data,
  ctx,
  lang = LanguageEnum.EN,
}: {
  original: Extract<keyof T, string>;
  copy: Extract<keyof T, string>;
  data: T;
  ctx: z.RefinementCtx;
  lang?: LanguageEnum;
}) => {
  if (data[original] === data[copy]) {
    ctx.addIssue({
      code: "custom",
      path: [copy],
      message:
        lang === LanguageEnum.EN
          ? `${copy} must not match ${original}`
          : `${copy} يجب أن لا يتطابق مع ${original}`,
    });
  }
};

export const generalValidationFields = {
  email: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.email({
      message: getValidationMessage("email", lang),
    });
  },
  subject: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.enum(EmailSubjectEnum, {
      message: getValidationMessage("subject", lang),
    });
  },
  title: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.enum(EmailTitleEnum, {
      message: getValidationMessage("title", lang),
    });
  },
  otp: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z
      .string()
      .regex(/^\d{6}$/, { message: getValidationMessage("otp", lang) });
  },
  password: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
      message: getValidationMessage("password", lang),
    });
  },
  username: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.string().regex(/^[a-zA-Z]+ [a-zA-Z]+$/, {
      message: getValidationMessage("username", lang),
    });
  },
  firstName: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.string().regex(/^[a-zA-Z]{2,25}$/, {
      message: getValidationMessage("firstName", lang),
    });
  },
  lastName: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.string().regex(/^[a-zA-Z]{2,25}$/, {
      message: getValidationMessage("lastName", lang),
    });
  },
  gender: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.enum(GenderEnum);
  },
  followRequestStatus: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.enum(ProcessFollowRequestStatusEnum);
  },
  phone: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.string().regex(/^01(0|1|2|5)\d{8}$/, {
      message: getValidationMessage("phone", lang),
    });
  },
  id: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z
      .string()
      .refine((idValue) => mongoose.Types.ObjectId.isValid(idValue), {
        message: getValidationMessage("id", lang),
      });
  },
  search_query: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.string().regex(/^[a-zA-Z]+\s?[a-zA-Z]+$/, {
      message: getValidationMessage("search_query", lang),
    });
  },
  accountPrivacy: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.enum(AccountPrivacyEnum);
  },
  file: (lang: LanguageEnum = LanguageEnum.EN) => {
    return z.strictObject({
      fieldname: z.string(),
      originalname: z.string(),
      encoding: z.string(),
      mimetype: z.string(),
      buffer: z.instanceof(Buffer),
      size: z.number(),
      path: z.string(),
    });
  },
  matchFields,
  NotMatchFields,
};
