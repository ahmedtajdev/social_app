import { JwtPayload } from "jsonwebtoken";
import {
  AccountPrivacyEnum,
  EmailSubjectEnum,
  EmailTitleEnum,
  FollowRequestStatusEnum,
  LogoutEnum,
  ProcessFollowRequestStatusEnum,
} from "../../common/enum";
import {
  BadRequestException,
  ConflictException,
  NotfoundException,
  UnauthorizedException,
} from "../../common/exception";
import { IPaginate, IUser } from "../../common/interface";
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
import mongoose, { HydratedDocument } from "mongoose";
import { userEmailKey } from "../../common/utils";
import { ACCESS_TOKEN_EXPIRES_IN } from "../../config";
import {
  followRepository,
  FollowRepository,
  followRequestRepository,
  FollowRequestRepository,
  userRepository,
  UserRepository,
} from "../../common/repository";
import {
  UpdatePasswordDto,
  updateProfileDto,
  verifyEnableTwoStepVerificationCodeDto,
} from "../authentication/authentication.dto";
import { CacheService, cacheService } from "../../common/services";
import { IProfile, IUserPreview } from "./user.interface";

export class UserService {
  private userRepository: UserRepository;
  private followRepository: FollowRepository;
  private followRequestRepository: FollowRequestRepository;
  private cacheService: CacheService;
  constructor() {
    this.userRepository = userRepository;
    this.followRepository = followRepository;
    this.followRequestRepository = followRequestRepository;
    this.cacheService = cacheService;
  }

  async getMyProfile(user: HydratedDocument<IUser>): Promise<IProfile> {
    const phone = user.phone ? await decrypt(user.phone) : undefined;
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      image: user.image,
      coverImage: user.coverImage,
      phone: phone ? phone : null,
    };
  }

  async getUserProfile({
    user,
    profileId,
  }: {
    user: HydratedDocument<IUser>;
    profileId: mongoose.Types.ObjectId;
  }): Promise<IUserPreview | IProfile> {
    if (profileId.equals(user._id)) {
      return await this.getMyProfile(user);
    }

    const profile = await this.userRepository.findById({
      id: profileId,
      projection: "firstName lastName image",
    });

    if (!profile) {
      throw new NotfoundException("Profile not found");
    }

    return profile.toJSON();
  }

  async updateProfile(
    user: HydratedDocument<IUser>,
    updates: updateProfileDto["body"],
  ): Promise<IProfile> {
    for (const [key, value] of Object.entries(updates)) {
      if (key === "phone") {
        user.set(key, await encrypt(value as string));
      } else {
        user.set(key, value);
      }
    }

    await user.save();

    return await this.getMyProfile(user);
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
      const hashOtp = await this.cacheService.get({
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

      await this.cacheService.del({
        keys: await this.cacheService.keys({
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
        await this.cacheService.del({
          keys: await this.cacheService.keys({
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

  async sendFollowRequest({
    user,
    targetUser,
  }: {
    user: HydratedDocument<IUser>;
    targetUser: HydratedDocument<IUser>;
  }) {
    try {
      await this.followRequestRepository.createOne({
        data: {
          senderId: user._id,
          receiverId: targetUser._id,
        },
      });
      return `Follow request sent to ${targetUser.firstName} ${targetUser.lastName}`;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestException(
          "You already sent a follow request to this user",
        );
      }
      throw error;
    }
  }

  async createFollow({
    user,
    targetUser,
  }: {
    user: HydratedDocument<IUser>;
    targetUser: HydratedDocument<IUser>;
  }) {
    try {
      await this.followRepository.createOne({
        data: {
          followerId: user._id,
          followingId: targetUser._id,
        },
      });
    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestException("You are already following this user");
      }
      throw error;
    }

    return `You are now following ${targetUser.firstName} ${targetUser.lastName}`;
  }

  async follow({
    user,
    targetUserId,
  }: {
    user: HydratedDocument<IUser>;
    targetUserId: mongoose.Types.ObjectId;
  }) {
    const targetUser = await this.userRepository.findOne({
      filter: { _id: targetUserId, confirmEmail: { $exists: true } },
    });

    if (!targetUser) {
      throw new NotfoundException("User not found");
    }

    if (user._id.equals(targetUser._id)) {
      throw new BadRequestException("You cannot follow yourself");
    }

    if (targetUser.accountPrivacy === AccountPrivacyEnum.PRIVATE) {
      return await this.sendFollowRequest({ user, targetUser });
    }

    return await this.createFollow({ user, targetUser });
  }

  async unfollow({
    user,
    targetUserId,
  }: {
    user: HydratedDocument<IUser>;
    targetUserId: mongoose.Types.ObjectId;
  }) {
    const targetUser = await this.userRepository.findOne({
      filter: { _id: targetUserId, confirmEmail: { $exists: true } },
    });

    if (!targetUser) {
      throw new NotfoundException("User not found");
    }

    if (user._id.equals(targetUser._id)) {
      throw new BadRequestException("You cannot unfollow yourself");
    }

    const [f_result, r_result] = await Promise.all([
      this.followRepository.deleteOne({
        filter: {
          followerId: user._id,
          followingId: targetUser._id,
        },
      }),
      this.followRequestRepository.deleteOne({
        filter: {
          senderId: user._id,
          receiverId: targetUser._id,
        },
      }),
    ]);

    if (!f_result.deletedCount || !r_result.deletedCount) {
      throw new BadRequestException("You are not following this user");
    }

    return `You unfollowed ${targetUser.firstName} ${targetUser.lastName}`;
  }

  async getUserFollowers({
    user,
    targetUserId,
    resultLimit = 10,
    filter = {},
  }: {
    user: HydratedDocument<IUser>;
    targetUserId: mongoose.Types.ObjectId;
    resultLimit?: number;
    filter?: mongoose._QueryFilter<IUser>;
  }): Promise<IPaginate<IUserPreview>> {
    const targetUser = await this.userRepository.findOne({
      filter: { _id: targetUserId, confirmEmail: { $exists: true } },
    });

    if (!targetUser) {
      throw new NotfoundException("User not found");
    }

    const { docs, docsCount, totalPages, currentPage, limit } =
      await this.followRepository.paginate({
        filter: {
          followingId: targetUser._id,
          ...filter,
        },
        options: {
          populate: {
            path: "followerId",
            select: "firstName lastName image",
          },
        },
        limit: resultLimit,
      });

    const result = docs.map((doc) => doc.followerId);

    return {
      docsCount,
      totalPages,
      currentPage,
      limit,
      docs: result,
    };
  }

  async getUserFollowing({
    user,
    targetUserId,
    resultLimit = 10,
    filter = {},
  }: {
    user: HydratedDocument<IUser>;
    targetUserId: mongoose.Types.ObjectId;
    resultLimit?: number;
    filter?: mongoose._QueryFilter<IUser>;
  }): Promise<IPaginate<IUserPreview>> {
    const targetUser = await this.userRepository.findOne({
      filter: { _id: targetUserId, confirmEmail: { $exists: true } },
    });

    if (!targetUser) {
      throw new NotfoundException("User not found");
    }

    const { docs, currentPage, totalPages, limit, docsCount } =
      await this.followRepository.paginate({
        filter: {
          followerId: targetUser._id,
          ...filter,
        },
        options: {
          populate: {
            path: "followingId",
            select: "firstName lastName image",
          },
        },
        limit: resultLimit,
      });

    const result = docs.map((doc) => doc.followingId);

    return {
      docsCount,
      totalPages,
      currentPage,
      limit,
      docs: result,
    };
  }

  async getUserSearchResult({
    user,
    search_query,
  }: {
    user: HydratedDocument<IUser>;
    search_query: string;
  }): Promise<IPaginate<IUserPreview>> {
    const s_query = search_query.toLowerCase().trim();

    const { docs, currentPage, totalPages, limit, docsCount } =
      await this.userRepository.paginate({
        filter: {
          $or: [
            { firstName: { $regex: s_query, $options: "i" } },
            { lastName: { $regex: s_query, $options: "i" } },
          ],
        },
        limit: 10,
      });

    const result = docs.map((doc) => {
      return {
        _id: doc._id,
        username: doc.username,
        image: doc.image,
      };
    });

    return {
      currentPage,
      totalPages,
      limit,
      docsCount,
      docs: result,
    };
  }

  async getFollowSuggestions({ user }: { user: HydratedDocument<IUser> }) {
    const { docs: userFollowingList } = await this.getUserFollowing({
      user,
      targetUserId: user._id,
      resultLimit: 5,
    });

    const excludedUsers = [
      ...userFollowingList.map((item) => item._id),
      user._id,
    ];

    console.log({ IamFollowing: userFollowingList });

    const suggestions = await Promise.all(
      userFollowingList.map(async (follow) => {
        const { docs } = await this.getUserFollowing({
          user,
          targetUserId: follow._id,
          resultLimit: 5,
          filter: {
            followingId: { $nin: excludedUsers },
          },
        });
        return docs;
      }),
    );

    const allSuggestions = suggestions.flat();

    const entries = allSuggestions.map((suggestion): [string, IUserPreview] => [
      suggestion._id.toString(),
      suggestion,
    ]);

    const uniqueSuggestions = new Map(entries);

    const result = [...uniqueSuggestions.values()];

    return result;
  }

  async getFollowRequests({
    user,
  }: {
    user: HydratedDocument<IUser>;
    resultLimit?: number;
    filter?: mongoose._QueryFilter<IUser>;
  }): Promise<IPaginate<IUserPreview>> {
    const { docs, docsCount, totalPages, currentPage, limit } =
      await this.followRequestRepository.paginate({
        filter: {
          receiverId: user._id,
        },
        options: {
          populate: {
            path: "senderId",
            select: "firstName lastName image",
          },
          sort: { createdAt: -1 },
        },
      });

    const result = docs.map((doc) => {
      return {
        _id: doc._id,
        sender: doc.senderId,
        status: doc.status,
      };
    });

    return {
      docsCount,
      totalPages,
      currentPage,
      limit,
      docs: result,
    };
  }

  async processFollowRequests({
    user,
    requestId,
    status,
  }: {
    user: HydratedDocument<IUser>;
    requestId: mongoose.Types.ObjectId;
    status: ProcessFollowRequestStatusEnum;
  }) {
    const request = await this.followRequestRepository.findOne({
      filter: {
        _id: requestId,
        receiverId: user._id,
      },
    });

    if (!request) {
      throw new NotfoundException("Request not found");
    }

    if (request.status > FollowRequestStatusEnum.PENDING) {
      throw new BadRequestException("Request already processed");
    }

    (request.status as unknown as ProcessFollowRequestStatusEnum) = status;
    await request.save();

    if (request.status === FollowRequestStatusEnum.REJECTED) {
      return "Follow request rejected";
    }

    const requestSender = await this.userRepository.findById({
      id: request.senderId,
    });
    await this.createFollow({
      user: requestSender as HydratedDocument<IUser>,
      targetUser: user,
    });

    return "Follow request accepted";
  }

  async cancelFollowRequest({
    user,
    requestId,
  }: {
    user: HydratedDocument<IUser>;
    requestId: mongoose.Types.ObjectId;
  }): Promise<string> {
    const { deletedCount } = await this.followRequestRepository.deleteOne({
      filter: {
        _id: requestId,
        senderId: user._id,
        status: FollowRequestStatusEnum.PENDING,
      },
    });

    if (deletedCount === 0) {
      throw new NotfoundException("Request not found");
    }

    return "Follow request cancelled";
  }

  async changeAccountPrivacy({
    user,
    accountPrivacy,
  }: {
    user: HydratedDocument<IUser>;
    accountPrivacy: AccountPrivacyEnum;
  }): Promise<string> {
    if (user.accountPrivacy === accountPrivacy) {
      throw new BadRequestException(
        `Your account is already set to ${AccountPrivacyEnum[accountPrivacy].toLocaleLowerCase()}`,
      );
    }

    user.accountPrivacy = accountPrivacy;
    await user.save();
    return `Your account privacy has been changed to ${AccountPrivacyEnum[accountPrivacy].toLocaleLowerCase()}`;
  }
}

export default new UserService();
