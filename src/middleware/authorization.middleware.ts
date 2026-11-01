import { NextFunction, Request, Response } from "express";
import { AccountPrivacyEnum } from "../common/enum";
import { ForbiddenException, NotfoundException } from "../common/exception";
import { followRepository, userRepository } from "../common/repository";

export const authorization = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const targetUserId = req.validated.params.targetUserId;
    const targetUser = await userRepository.findById({ id: targetUserId });

    if (!targetUser) {
      throw new NotfoundException("User not Found");
    }

    const follow = await followRepository.findOne({
      filter: {
        followerId: req.user._id,
        followingId: targetUser._id,
      },
    });

    if (
      targetUser.accountPrivacy === AccountPrivacyEnum.PRIVATE &&
      !follow &&
      !targetUser._id.equals(req.user._id)
    ) {
      throw new ForbiddenException("Forbidden account");
    }
    next();
  };
};
