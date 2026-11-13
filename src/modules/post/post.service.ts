import { NotfoundException } from "../../common/exception";
import { IPaginate, IPost } from "../../common/interface";
import {
  followRepository,
  FollowRepository,
  postRepository,
  PostRepository,
  userRepository,
  UserRepository,
} from "../../common/repository";
import { FileType, idType } from "../../common/types";
import { HPost, HUser } from "../../DB/models";
import { AccountPrivacyEnum, PostStatusEnum } from "../../common/enum";

export class PostService {
  private readonly postRepository: PostRepository;
  private readonly userRepository: UserRepository;
  private readonly followRepository: FollowRepository;
  constructor() {
    this.postRepository = postRepository;
    this.userRepository = userRepository;
    this.followRepository = followRepository;
  }

  async createNewPost({
    user,
    text,
    isAnonymous,
    attachments = [],
  }: {
    user: HUser;
    text?: string;
    isAnonymous?: boolean;
    attachments?: FileType[];
  }): Promise<IPost> {
    const post = (await this.postRepository.createOne({
      data: {
        author: user._id,
        text,
        attachments: attachments.map((file) => file.path),
        isAnonymous,
      },
    })) as HPost;

    return post.toJSON();
  }

  async getAllUserPosts({ user }: { user: HUser }): Promise<IPaginate<IPost>> {
    const { docsCount, totalPages, limit, currentPage, docs } =
      await this.postRepository.paginate({
        filter: {
          authorId: user._id,
        },
        options: {
          populate: {
            path: "author",
            select: "firstName lastName image",
          },
        },
      });

    return { docsCount, totalPages, limit, currentPage, docs };
  }

  async getPostById({
    user,
    postId,
  }: {
    user: HUser;
    postId: idType;
  }): Promise<IPost> {
    const post = await this.postRepository.findById({
      id: postId,
      options: {
        populate: {
          path: "author",
          select: "firstName lastName image",
        },
      },
    });

    if (!post) {
      throw new NotfoundException("Post not found");
    }

    const author = await this.userRepository.findById({ id: post.author });

    if (!author) {
      throw new NotfoundException("Author not found");
    }

    if (
      author.accountPrivacy === AccountPrivacyEnum.PRIVATE &&
      !user._id.equals(author._id)
    ) {
      const follow = await this.followRepository.findOne({
        filter: {
          followerId: user._id,
          followingId: author._id,
        },
      });

      if (!follow) {
        throw new NotfoundException("Post not found");
      }
    }

    return post.toJSON();
  }

  async updatePost({
    user,
    postId,
    update,
  }: {
    user: HUser;
    postId: idType;
    update: IPost;
  }): Promise<IPost> {
    const post = await this.postRepository.findOneAndUpdate({
      filter: {
        _id: postId,
        author: user._id,
      },
      update: {
        ...update,
        attachments: update.attachments?.length
          ? (update.attachments as unknown as FileType[]).map(
              (file) => file.path,
            )
          : [],
      },
      options: {
        populate: {
          path: "author",
          select: "firstName lastName image",
        },
      },
    });

    if (!post) {
      throw new NotfoundException("Post not found");
    }

    return post.toJSON();
  }

  async deletePost({
    user,
    postId,
  }: {
    user: HUser;
    postId: idType;
  }): Promise<string> {
    const { modifiedCount } = await this.postRepository.updateOne({
      filter: {
        _id: postId,
        author: user._id,
      },
      update: {
        status: PostStatusEnum.ARCHIVED,
      },
    });

    if (!modifiedCount) {
      throw new NotfoundException("Post not found");
    }

    return "Post deleted successfully";
  }
}

export default new PostService();
