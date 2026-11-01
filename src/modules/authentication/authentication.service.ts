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
import { cacheService, CacheService } from "../../common/services";
import { ISignup } from "./authentication.interface";

export class AuthenticationService {
  private userRepository: UserRepository;
  private cacheService: CacheService;
  private readonly client: OAuth2Client;

  constructor() {
    this.userRepository = userRepository;
    this.cacheService = cacheService;
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
    subject: EmailSubjectEnum;
    title: string;
    expiresIn?: number;
    maxTrials?: number;
    blockInSeconds?: number;
  }) {
    try {
      const existOtp_TTL = await this.cacheService.ttl({
        key: userEmailKey({ email, subject }),
      });

      if (existOtp_TTL > 0) {
        throw new ConflictException(
          `Sorry we cannot create new OTP while existing one still valid. Please try again later after ${existOtp_TTL}s`,
        );
      }

      const oldTrials =
        (await this.cacheService.get({
          key: userEmailTrialsKey({ email, subject }),
        })) ?? 0;

      if (oldTrials >= maxTrials) {
        throw new TooManyRequestsException(
          `Max OTP trials have been reached, please try again after ${await this.cacheService.ttl({ key: userEmailTrialsKey({ email, subject }) })}s`,
        );
      }

      const code = createOtp();

      await this.cacheService.set({
        key: userEmailKey({ email, subject }),
        value: await hash(code.toString()),
        ttl: expiresIn,
      });

      const currentTrials = await this.cacheService.incBy({
        key: userEmailTrialsKey({ email, subject }),
      });

      if (currentTrials === maxTrials) {
        await this.cacheService.expire({
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
  }: SignupDto["body"]): Promise<ISignup> {
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

      const message = await this.sendEmailOtp({
        email,
        subject: EmailSubjectEnum.CONFIRM_EMAIL,
        title: EmailTitleEnum.CONFIRM_EMAIL,
      });

      return {
        message,
        user: {
          _id: user._id,
          username: user.username as string,
          image: user.image ? user.image : null,
        },
      };
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

      const hashOtp = await this.cacheService.get({
        key: userEmailKey({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL }),
      });

      if (!hashOtp || !(await compare(otp, hashOtp))) {
        throw new ConflictException("Invalid OTP");
      }

      user.confirmEmail = new Date().toDateString();
      await user.save();
      await this.cacheService.del({
        keys: await this.cacheService.keys({
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

      const hashOtp = await this.cacheService.get({
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
      this.cacheService.keys({
        prefix: userBaseRevokeTokenKey({ userId: user._id.toString() }),
      }),
      this.cacheService.keys({
        prefix: userEmailKey({
          email,
          subject: EmailSubjectEnum.FORGOT_PASSWORD,
        }),
      }),
    ]);

    await this.cacheService.del({ keys: [...result[0], ...result[1]] });

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

      const hashOtp = await this.cacheService.get({
        key: userEmailKey({
          email,
          subject: EmailSubjectEnum.LOGIN_CONFIRMATION,
        }),
      });

      if (!hashOtp || !(await compare(otp, hashOtp))) {
        throw new ConflictException("Invalid OTP");
      }

      await this.cacheService.del({
        keys: await this.cacheService.keys({
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
