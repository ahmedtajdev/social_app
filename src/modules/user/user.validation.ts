import z from "zod";
import { LanguageEnum } from "../../common/enum";
import { generalValidationFields } from "../../common/utils";

export const search_query = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    query: z.strictObject({
      search_query: generalValidationFields.search_query(lang),
    }),
  });

export const accountPrivacy = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    body: z.strictObject({
      accountPrivacy: generalValidationFields.accountPrivacy(lang),
    }),
  });

export const processFollowRequest = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    params: z.strictObject({
      requestId: generalValidationFields.id(lang),
    }),
    body: z.strictObject({
      status: generalValidationFields.followRequestStatus(lang),
    }),
  });

export const cancelFollowRequest = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    params: z.strictObject({
      requestId: generalValidationFields.id(lang),
    }),
  });

export const getUserProfile = (lang: LanguageEnum = LanguageEnum.EN) =>
  z.object({
    params: z.strictObject({
      profileId: generalValidationFields.id(lang),
    }),
  });
