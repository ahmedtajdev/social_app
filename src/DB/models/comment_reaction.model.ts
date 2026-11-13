import mongoose, { HydratedDocument, Schema } from "mongoose";
import { ICommentReaction } from "../../common/interface";
import { ReactionEnum } from "../../common/enum";

const commentReactionSchema = new mongoose.Schema<ICommentReaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    commentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

commentReactionSchema.index({ userId: 1, commentId: 1 }, { unique: true });

export const CommentReactionModel =
  mongoose.models.CommentReaction ||
  mongoose.model<ICommentReaction>("CommentReaction", commentReactionSchema);

export type HCommentReaction = HydratedDocument<ICommentReaction>;
