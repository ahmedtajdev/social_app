import mongoose, { HydratedDocument, Schema } from "mongoose";
import { IFollow } from "../../common/interface";

const followSchema = new mongoose.Schema<IFollow>(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },

  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    autoIndex: true,
    id: false,
  },
);

followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export const FollowModel =
  mongoose.models.Follow || mongoose.model<IFollow>("Follow", followSchema);

export type HFollow = HydratedDocument<IFollow>;
