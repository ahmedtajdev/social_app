import mongoose, { HydratedDocument } from "mongoose";
import {
  AccountPrivacyEnum,
  AccountStatusEnum,
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../common/enum";
import { IUser } from "../../common/interface";
import { encrypt, hash } from "../../common/security";
import { sendEmail } from "../../common/utils/email/send.email";
import { APP_EMAIL } from "../../config";

const userSchema = new mongoose.Schema<IUser>(
  {
    firstName: {
      type: String,
      minLength: 2,
      maxLength: 25,
      required: true,
    },
    lastName: {
      type: String,
      minLength: 2,
      maxLength: 25,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function (): boolean {
        return this.provider === ProviderEnum.SYSTEM;
      },
    },
    phone: { type: String, default: null },
    DOB: String,
    confirmEmail: Date,
    image: { type: String, default: null },
    coverImage: [String],
    changeCredentialsTime: Date,
    isTwoStepVerificationEnabled: Boolean,
    gender: {
      type: Number,
      enum: GenderEnum,
      default: GenderEnum.MALE,
    },
    role: {
      type: Number,
      enum: RoleEnum,
      default: RoleEnum.USER,
    },
    provider: {
      type: Number,
      enum: ProviderEnum,
      default: ProviderEnum.SYSTEM,
    },
    status: {
      type: Number,
      enum: AccountStatusEnum,
      default: AccountStatusEnum.ACTIVE,
    },
    changeStatusAt: Date,
    accountPrivacy: {
      type: Number,
      enum: AccountPrivacyEnum,
      default: AccountPrivacyEnum.PUBLIC,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
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

userSchema
  .virtual("username")
  .set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName });
  })
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  });

userSchema.pre("validate", function () {
  if (this.provider === ProviderEnum.GOOGLE && this.password) {
    throw new Error("Google account cannot hold password");
  }
});

userSchema.pre("save", async function (this: HUser & { wasNew: boolean }) {
  this.wasNew = this.isNew;

  if (this.isModified("password")) {
    this.password = await hash(this.password);
  }

  if (this.phone && this.isModified("phone")) {
    this.phone = await encrypt(this.phone);
  }
});

userSchema.post("save", async function (doc) {
  const wasNewUser = (this as HUser & { wasNew: boolean }).wasNew;
  if (wasNewUser) {
    await sendEmail({
      to: [APP_EMAIL],
      subject: "New User",
      text: `${doc.firstName} ${doc.lastName} has registered with email: ${doc.email}`,
    });
  }
});

userSchema.pre(["findOne", "find", "countDocuments"], function () {
  const query = this.getFilter();

  if (query.paranoid !== false) {
    this.setQuery({ ...query, status: { $ne: AccountStatusEnum.ARCIVE } });
  }
});

userSchema.pre(["updateOne", "updateMany", "findOneAndUpdate"], function () {
  const query = this.getFilter();
  const update = this.getUpdate() as mongoose.UpdateQuery<HUser>;

  if (update.status) {
    if (update.status === AccountStatusEnum.ARCIVE) {
      this.setQuery({
        ...query,
        status: { $ne: AccountStatusEnum.ARCIVE },
      });
    } else if (update.status === AccountStatusEnum.ACTIVE) {
      this.setQuery({
        ...query,
        status: { $ne: AccountStatusEnum.ACTIVE },
      });
    }
  }

  if (!update.status && query.paranoid !== false) {
    this.setQuery({
      ...query,
      status: { $ne: AccountStatusEnum.ARCIVE },
    });
  }

  this.setUpdate({
    ...update,
    ...(update.status ? { changeStatusAt: new Date() } : {}),
  });
});

userSchema.pre(["deleteOne", "deleteMany", "findOneAndDelete"], function () {
  const query = this.getFilter();

  if (query.force !== true) {
    this.setQuery({
      ...query,
      status: { $eq: AccountStatusEnum.ARCIVE },
    });
  }
});

export const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export type HUser = HydratedDocument<IUser>;
