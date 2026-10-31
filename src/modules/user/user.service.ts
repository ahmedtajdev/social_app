import { JwtPayload } from "jsonwebtoken";
import {
  EmailSubjectEnum,
  EmailTitleEnum,
  LogoutEnum,
} from "../../common/enum";
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "../../common/exception";
import { IUser } from "../../common/interface";
import {
  compare,
  createLoginCredentials,
  createRevokeToken,
  decrypt,
  encrypt,
  hash,
  userBaseRevokeTokenKey,
} from "../../common/security";
import authenticationService from "../authentication/authentication.service";
import { HydratedDocument } from "mongoose";
import { del, get, keys } from "../../common/services";
import { userEmailKey } from "../../common/utils";
import { ACCESS_TOKEN_EXPIRES_IN } from "../../config";
import { userRepository, UserRepository } from "../../common/repository";
import {
  UpdatePasswordDto,
  updateProfileDto,
  verifyEnableTwoStepVerificationCodeDto,
} from "../authentication/authentication.dto";

export class UserService {
  private userRepository: UserRepository;
  constructor() {
    this.userRepository = userRepository;
  }

  async getProfile(user: HydratedDocument<IUser>) {
    const phone = user.phone ? await decrypt(user.phone) : undefined;
    return {
      ...user.toObject(),
      phone,
    };
  }

  async updateProfile(
    user: HydratedDocument<IUser>,
    updates: updateProfileDto["body"],
  ) {
    for (const [key, value] of Object.entries(updates)) {
      if (key === "phone") {
        user.set(key, await encrypt(value as string));
      } else {
        user.set(key, value);
      }
    }

    await user.save();

    return await this.getProfile(user);
  }

  async rotateToken({
    payload,
    user,
    issuer,
  }: {
    payload: JwtPayload;
    user: HydratedDocument<IUser>;
    issuer?: string | undefined;
  }) {
    const accessExpiresIn =
      ((payload.iat as number) + ACCESS_TOKEN_EXPIRES_IN) * 1000;
    const currentTime = Date.now();

    if (currentTime < accessExpiresIn) {
      throw new ConflictException(
        "Sorry we cannot create new login credentials while current access token still within valid time",
      );
    }

    const data = await createLoginCredentials({ user, issuer });
    await createRevokeToken({ payload });
    return data;
  }

  async enableTwoStepVerification(user: IUser) {
    try {
      if (user.isTwoStepVerificationEnabled) {
        throw new ConflictException("Two Step Verification already enabled");
      }

      await authenticationService.sendEmailOtp({
        email: user.email,
        subject: EmailSubjectEnum.ENABLE_TWO_STEP_VERIFICATION,
        title: EmailTitleEnum.ENABLE_TWO_STEP_VERIFICATION,
      });

      return "OTP sent to your email, please check your email and verify the OTP to enable Two Step Verification";
    } catch (error) {
      throw error;
    }
  }

  async verifyEnableTwoStepVerificationCode(
    user: HydratedDocument<IUser>,
    body: verifyEnableTwoStepVerificationCodeDto["body"],
  ) {
    try {
      const { otp } = body;
      const hashOtp = await get({
        key: userEmailKey({
          email: user.email,
          subject: EmailSubjectEnum.ENABLE_TWO_STEP_VERIFICATION,
        }),
      });

      if (!hashOtp || !(await compare(otp, hashOtp))) {
        throw new ConflictException("Invalid OTP");
      }

      user.isTwoStepVerificationEnabled = true;
      await user.save();

      await del({
        keys: await keys({
          prefix: userEmailKey({
            email: user.email,
            subject: EmailSubjectEnum.ENABLE_TWO_STEP_VERIFICATION,
          }),
        }),
      });

      return "Two Step Verification enabled successfully";
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(
    user: HydratedDocument<IUser>,
    payload: JwtPayload,
    body: UpdatePasswordDto["body"],
  ) {
    try {
      const { currentPassword, newPassword } = body;

      const isCurrentPasswordCorrect = await compare(
        currentPassword,
        user.password,
      );

      if (!isCurrentPasswordCorrect) {
        throw new UnauthorizedException("Unauthorized user");
      }

      user.password = await hash(newPassword);
      await user.save();
      await this.logout({ payload, user, action: LogoutEnum.ALL });

      return "Password updated successfully";
    } catch (error) {
      throw error;
    }
  }

  async logout({
    payload,
    user,
    action = LogoutEnum.DEVICE,
  }: {
    payload: JwtPayload;
    user: HydratedDocument<IUser>;
    action?: LogoutEnum;
  }) {
    switch (action) {
      case LogoutEnum.ALL:
        user.changeCredentialsTime = new Date().toDateString();
        await user.save();
        await del({
          keys: await keys({
            prefix: userBaseRevokeTokenKey({ userId: payload.sub as string }),
          }),
        });
        return "Logout from all devices successfully";

      case LogoutEnum.DEVICE:
        await createRevokeToken({ payload });
        return "Logout from current device successfully";
      default:
        throw new BadRequestException("Invalid action");
    }
  }
}

export default new UserService();
