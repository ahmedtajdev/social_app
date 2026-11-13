import mongoose, { HydratedDocument, Schema } from "mongoose";
import { IPostReaction } from "../../common/interface";
import { ReactionEnum } from "../../common/enum";

const postReactionSchema = new mongoose.Schema<IPostReaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    reaction: {
      type: Number,
      enum: ReactionEnum,
      required: true,
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

postReactionSchema.index({ userId: 1, postId: 1 }, { unique: true });

export const PostReactionModel =
  mongoose.models.PostReaction ||
  mongoose.model<IPostReaction>("PostReaction", postReactionSchema);

export type HPostReaction = HydratedDocument<IPostReaction>;
