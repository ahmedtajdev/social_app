import { HydratedDocument } from "mongoose";
import {
  ConfirmEmailDto,
  ForgotPasswordDto,
  LoginConfirmationDto,
  LoginDto,
  ResendEmailOtpDto,
  ResetForgotPasswordDto,
  SignupDto,
} from "./authentication.dto";
import { IUser } from "../../common/interface";
import { HUser } from "../../DB/models";
import {
  BadRequestException,
  ConflictException,
  NotfoundException,
  TooManyRequestsException,
} from "../../common/exception";
import { UserRepository, userRepository } from "../../common/repository";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { WEB_CLIENT_IDS } from "../../config";
import {
  EmailSubjectEnum,
  EmailTitleEnum,
  ProviderEnum,
} from "../../common/enum";
import { del, expire, get, incBy, keys, set, ttl } from "../../common/services";
import {
  compare,
  createLoginCredentials,
  encrypt,
  hash,
  userBaseRevokeTokenKey,
} from "../../common/security";
import {
  emailEvent,
  userEmailKey,
  userEmailTrialsKey,
} from "../../common/utils";
import { createOtp } from "../../common/utils";

export class AuthenticationService {
  private userRepository: UserRepository;
  private client: OAuth2Client;

  constructor() {
    this.userRepository = userRepository;
    this.client = new OAuth2Client();
  }

  async verifyGoogleAccount({
    idToken,
  }: {
    idToken: string;
  }): Promise<TokenPayload> {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: WEB_CLIENT_IDS,
    });
    const payload = ticket.getPayload();

    if (!payload?.email_verified) {
      throw new BadRequestException("Email not verified");
    }

    return payload;
  }

  async signupWithGmail({ idToken }: { idToken: string }) {
    try {
      const { name, email, picture } = await this.verifyGoogleAccount({
        idToken,
      });

      const existAccount = await this.userRepository.findOne({
        filter: { email: email as string },
      });

      if (existAccount) {
        if (existAccount.provider !== ProviderEnum.GOOGLE) {
          throw new ConflictException("Invalid account provider");
        }

        return {
          status: 200,
          data: await createLoginCredentials({
            user: existAccount,
          }),
        };
      }

      const user = await this.userRepository.createOne({
        data: {
          username: name,
          email,
          confirmEmail: new Date(),
          provider: ProviderEnum.GOOGLE,
          image: picture,
        },
      });

      return {
        status: 201,
        data: await createLoginCredentials({ user }),
      };
    } catch (error) {
      throw error;
    }
  }

  async sendEmailOtp({
    email,
    subject,
    title,
    expiresIn = 120,
    maxTrials = 3,
    blockInSeconds = 300,
  }: {
    email: string;
    subject: string;
    title: string;
    expiresIn?: number;
    maxTrials?: number;
    blockInSeconds?: number;
  }) {
    try {
      const existOtp_TTL = await ttl({ key: userEmailKey({ email, subject }) });

      if (existOtp_TTL > 0) {
        throw new ConflictException(
          `Sorry we cannot create new OTP while existing one still valid. Please try again later after ${existOtp_TTL}s`,
        );
      }

      const oldTrials =
        (await get({ key: userEmailTrialsKey({ email, subject }) })) ?? 0;

      if (oldTrials >= maxTrials) {
        throw new TooManyRequestsException(
          `Max OTP trials have been reached, please try again after ${await ttl({ key: userEmailTrialsKey({ email, subject }) })}s`,
        );
      }

      const code = createOtp();

      await set({
        key: userEmailKey({ email, subject }),
        value: await hash(code.toString()),
        ttl: expiresIn,
      });

      const currentTrials = await incBy({
        key: userEmailTrialsKey({ email, subject }),
      });

      if (currentTrials === maxTrials) {
        await expire({
          key: userEmailTrialsKey({ email, subject }),
          ttl: blockInSeconds,
        });
      }

      emailEvent.emit("sendEmail", {
        recipients: { to: email },
        subject,
        data: { code, title: title ?? subject, expiresIn },
      });

      return "OTP sent to your email, please check your email and verify the OTP";
    } catch (error) {
      throw error;
    }
  }

  async signup({
    username,
    email,
    password,
    phone,
  }: SignupDto["body"]): Promise<string> {
    try {
      const duplicatedUser = await this.userRepository.findOne({
        filter: { email },
      });

      if (duplicatedUser) {
        throw new ConflictException("Email already Exists");
      }

      const user: HUser = await this.userRepository.createOne({
        data: {
          username,
          email,
          password: await hash(password),
          phone: phone ? await encrypt(phone) : undefined,
        },
        options: {
          validateBeforeSave: true,
        },
      });

      return await this.sendEmailOtp({
        email,
        subject: EmailSubjectEnum.CONFIRM_EMAIL,
        title: EmailTitleEnum.CONFIRM_EMAIL,
      });
    } catch (error) {
      throw error;
    }
  }

  async resendEmailOtp({
    email,
    subject,
    title,
  }: ResendEmailOtpDto["body"]): Promise<string> {
    try {
      const user = await this.userRepository.findOne({
        filter: {
          email,
          provider: ProviderEnum.SYSTEM,
          // confirmEmail: { $exists: false },
        },
      });

      if (!user) {
        throw new NotfoundException("Invalid account");
      }

      return await this.sendEmailOtp({
        email,
        subject,
        title,
      });
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword({ email }: ForgotPasswordDto["body"]): Promise<string> {
    try {
      const user = await this.userRepository.findOne({
        filter: {
          email,
          provider: ProviderEnum.SYSTEM,
          confirmEmail: { $exists: true },
        },
      });

      if (!user) {
        throw new NotfoundException("Invalid account");
      }

      return await this.sendEmailOtp({
        email,
        subject: EmailSubjectEnum.FORGOT_PASSWORD,
        title: EmailTitleEnum.FORGOT_PASSWORD,
      });
    } catch (error) {
      throw error;
    }
  }

  async confirmEmail({ otp, email }: ConfirmEmailDto["body"]): Promise<string> {
    try {
      const user = await this.userRepository.findOne({
        filter: {
          email,
          provider: ProviderEnum.SYSTEM,
          confirmEmail: { $exists: false },
        },
      });

      if (!user) {
        throw new NotfoundException("Invalid account");
      }

      const hashOtp = await get({
        key: userEmailKey({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL }),
      });

      if (!hashOtp || !(await compare(otp, hashOtp))) {
        throw new ConflictException("Invalid OTP");
      }

      user.confirmEmail = new Date().toDateString();
      await user.save();
      await del({
        keys: await keys({
          prefix: userEmailKey({
            email,
            subject: EmailSubjectEnum.CONFIRM_EMAIL,
          }),
        }),
      });
      return "Email confirmed successfully";
    } catch (error) {
      throw error;
    }
  }

  async verifyForgotPasswordCode({
    otp,
    email,
  }: ConfirmEmailDto["body"]): Promise<{
    message: string;
    user: HydratedDocument<IUser>;
  }> {
    try {
      const user = await this.userRepository.findOne({
        filter: {
          email,
          provider: ProviderEnum.SYSTEM,
          confirmEmail: { $exists: true },
        },
      });

      if (!user) {
        throw new NotfoundException("Invalid account");
      }

      const hashOtp = await get({
        key: userEmailKey({ email, subject: EmailSubjectEnum.FORGOT_PASSWORD }),
      });

      if (!hashOtp || !(await compare(otp, hashOtp))) {
        throw new ConflictException("Invalid OTP");
      }

      return { message: "OTP verified successfully", user };
    } catch (error) {
      throw error;
    }
  }

  resetForgotPassword = async ({
    otp,
    email,
    password,
  }: ResetForgotPasswordDto["body"]): Promise<string> => {
    const { user } = await this.verifyForgotPasswordCode({ otp, email });
    user.password = await hash(password);
    user.changeCredentialsTime = new Date().toDateString();
    await user.save();

    const result = await Promise.all([
      keys({
        prefix: userBaseRevokeTokenKey({ userId: user._id.toString() }),
      }),
      keys({
        prefix: userEmailKey({
          email,
          subject: EmailSubjectEnum.FORGOT_PASSWORD,
        }),
      }),
    ]);

    await del({ keys: [...result[0], ...result[1]] });

    return "Password reset successfully";
  };

  async login(
    { email, password }: LoginDto["body"],
    { issuer }: { issuer: string | undefined },
  ) {
    try {
      const user = await this.userRepository.findOne({
        filter: {
          email,
          provider: ProviderEnum.SYSTEM,
          confirmEmail: { $exists: true },
        },
      });

      if (!user) {
        throw new NotfoundException("Invalid email or password");
      }

      const match = await compare(password, user.password);

      if (!match) {
        throw new NotfoundException("Invalid email or password");
      }

      if (user.isTwoStepVerificationEnabled) {
        await this.sendEmailOtp({
          email,
          subject: EmailSubjectEnum.LOGIN_CONFIRMATION,
          title: EmailTitleEnum.LOGIN_CONFIRMATION,
        });
        return;
      }

      return await createLoginCredentials({ user, issuer });
    } catch (error) {
      throw error;
    }
  }

  async loginConfirmation(
    { otp, email }: LoginConfirmationDto["body"],
    { issuer }: { issuer: string | undefined },
  ) {
    try {
      const user = await this.userRepository.findOne({
        filter: {
          email,
          provider: ProviderEnum.SYSTEM,
          confirmEmail: { $exists: true },
        },
      });

      if (!user) {
        throw new NotfoundException("Invalid account");
      }

      const hashOtp = await get({
        key: userEmailKey({
          email,
          subject: EmailSubjectEnum.LOGIN_CONFIRMATION,
        }),
      });

      if (!hashOtp || !(await compare(otp, hashOtp))) {
        throw new ConflictException("Invalid OTP");
      }

      await del({
        keys: await keys({
          prefix: userEmailKey({
            email,
            subject: EmailSubjectEnum.LOGIN_CONFIRMATION,
          }),
        }),
      });

      return await createLoginCredentials({ user, issuer });
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthenticationService();
