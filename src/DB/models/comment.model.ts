import mongoose, { HydratedDocument, Schema } from "mongoose";
import { IComment } from "../../common/interface";
import { CommentStatusEnum } from "../../common/enum";

const commentSchema = new mongoose.Schema<IComment>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    text: String,
    attachments: { type: [String], default: [] },
    parentComment: {
      type: Schema.Types.ObjectId || null,
      ref: "Comment",
      default: null,
    },
    reactionCount: {
      type: Number,
      default: 0,
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Number,
      enum: CommentStatusEnum,
      default: CommentStatusEnum.PUBLISHED,
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

commentSchema.pre(["findOne", "find", "countDocuments"], function () {
  const query = this.getFilter();

  if (query.paranoid !== false) {
    this.setQuery({ ...query, status: { $ne: CommentStatusEnum.ARCHIVED } });
  }
});

commentSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], function () {
  const query = this.getFilter();
  const update = this.getUpdate() as mongoose.UpdateQuery<HComment>;

  if (update.status) {
    if (update.status === CommentStatusEnum.ARCHIVED) {
      this.setQuery({
        ...query,
        status: { $ne: CommentStatusEnum.ARCHIVED },
      });
    } else if (update.status === CommentStatusEnum.PUBLISHED) {
      this.setQuery({
        ...query,
        status: { $ne: CommentStatusEnum.PUBLISHED },
      });
    }
  }

  if (!update.status && query.paranoid !== false) {
    this.setQuery({
      ...query,
      status: { $ne: CommentStatusEnum.ARCHIVED },
    });
  }

  this.setUpdate({
    ...update,
    ...(update.status ? { changeStatusAt: new Date() } : {}),
  });
});

commentSchema.pre(["deleteOne", "deleteMany", "findOneAndDelete"], function () {
  const query = this.getFilter();

  if (query.force !== true) {
    this.setQuery({
      ...query,
      status: { $eq: CommentStatusEnum.ARCHIVED },
    });
  }
});

export const CommentModel =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema);

export type HComment = HydratedDocument<IComment>;
