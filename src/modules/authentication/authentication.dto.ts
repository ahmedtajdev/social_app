import z from "zod";
import {
  confirmEmail,
  forgotPassword,
  login,
  otp,
  resendEmailOtp,
  resetForgotPassword,
  signup,
  updatePassword,
  updateProfile,
} from "./authentication.validation";

export type SignupDto = z.infer<ReturnType<typeof signup>>;

export type LoginDto = z.infer<ReturnType<typeof login>>;

export type LoginConfirmationDto = z.infer<ReturnType<typeof confirmEmail>>;

export type ResendEmailOtpDto = z.infer<ReturnType<typeof resendEmailOtp>>;

export type ConfirmEmailDto = z.infer<ReturnType<typeof confirmEmail>>;

export type ForgotPasswordDto = z.infer<ReturnType<typeof forgotPassword>>;

export type VerifyForgotPasswordCodeDto = z.infer<
  ReturnType<typeof confirmEmail>
>;

export type ResetForgotPasswordDto = z.infer<
  ReturnType<typeof resetForgotPassword>
>;

export type UpdatePasswordDto = z.infer<ReturnType<typeof updatePassword>>;

export type verifyEnableTwoStepVerificationCodeDto = z.infer<
  ReturnType<typeof otp>
>;
export type updateProfileDto = z.infer<ReturnType<typeof updateProfile>>;
