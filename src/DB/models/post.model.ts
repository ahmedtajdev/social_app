import mongoose, { HydratedDocument, Schema } from "mongoose";
import { IPost } from "../../common/interface";
import { PostStatusEnum } from "../../common/enum";

const postSchema = new mongoose.Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, default: null },
    attachments: { type: [String], default: [] },
    reactionCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Number,
      enum: PostStatusEnum,
      default: PostStatusEnum.PUBLISHED,
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

postSchema.pre(["findOne", "find", "countDocuments"], function () {
  const query = this.getFilter();

  if (query.paranoid !== false) {
    this.setQuery({ ...query, status: { $ne: PostStatusEnum.ARCHIVED } });
  }
});

postSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], function () {
  const query = this.getFilter();
  const update = this.getUpdate() as mongoose.UpdateQuery<HPost>;

  if (update.status) {
    if (update.status === PostStatusEnum.ARCHIVED) {
      this.setQuery({
        ...query,
        status: { $ne: PostStatusEnum.ARCHIVED },
      });
    } else if (update.status === PostStatusEnum.PUBLISHED) {
      this.setQuery({
        ...query,
        status: { $ne: PostStatusEnum.PUBLISHED },
      });
    }
  }

  if (!update.status && query.paranoid !== false) {
    this.setQuery({
      ...query,
      status: { $ne: PostStatusEnum.ARCHIVED },
    });
  }

  this.setUpdate({
    ...update,
    ...(update.status ? { changeStatusAt: new Date() } : {}),
  });
});

postSchema.pre(["deleteOne", "deleteMany", "findOneAndDelete"], function () {
  const query = this.getFilter();

  if (query.force !== true) {
    this.setQuery({
      ...query,
      status: { $eq: PostStatusEnum.ARCHIVED },
    });
  }
});

export const PostModel =
  mongoose.models.Post || mongoose.model<IPost>("Post", postSchema);

export type HPost = HydratedDocument<IPost>;
