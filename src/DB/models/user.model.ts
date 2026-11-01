import mongoose, { HydratedDocument } from "mongoose";
import {
  AccountPrivacyEnum,
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../common/enum";
import { IUser } from "../../common/interface";

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
    accountPrivacy: {
      type: Number,
      enum: AccountPrivacyEnum,
      default: AccountPrivacyEnum.PUBLIC,
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

export const UserModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export type HUser = HydratedDocument<IUser>;
