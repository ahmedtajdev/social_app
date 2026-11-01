import mongoose, { HydratedDocument, Schema } from "mongoose";
import { IFollowRequest } from "../../common/interface";
import { FollowRequestStatusEnum } from "../../common/enum";

const followRequestSchema = new mongoose.Schema<IFollowRequest>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: Number,
      enum: FollowRequestStatusEnum,
      default: FollowRequestStatusEnum.PENDING,
    },
  },

  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    id: false,
  },
);

followRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

export const FollowRequestModel =
  mongoose.models.FollowRequest ||
  mongoose.model<IFollowRequest>("FollowRequest", followRequestSchema);

export type HFollowRequest = HydratedDocument<IFollowRequest>;
