import { NotfoundException } from "../../common/exception";
import { IComment, IPaginate, IPost } from "../../common/interface";
import {
  commentRepository,
  CommentRepository,
  followRepository,
  FollowRepository,
  postRepository,
  PostRepository,
  userRepository,
  UserRepository,
} from "../../common/repository";
import { FileType, idType } from "../../common/types";
import { HComment, HUser } from "../../DB/models";
import { AccountPrivacyEnum, CommentStatusEnum } from "../../common/enum";

export class CommentService {
  private readonly commentRepository: CommentRepository;
  private readonly postRepository: PostRepository;
  private readonly userRepository: UserRepository;
  private readonly followRepository: FollowRepository;
  constructor() {
    this.commentRepository = commentRepository;
    this.postRepository = postRepository;
    this.userRepository = userRepository;
    this.followRepository = followRepository;
  }

  async createComment({
    user,
    post,
    text,
    isAnonymous,
    attachments = [],
  }: {
    user: HUser;
    post: idType;
    text?: string;
    isAnonymous?: boolean;
    attachments?: FileType[];
  }): Promise<IComment> {
    const comment = (await this.commentRepository.createOne({
      data: {
        post,
        author: user._id,
        text,
        attachments: attachments.map((file) => file.path),
        isAnonymous,
      },
    })) as HComment;

    return comment.toJSON();
  }

  async getAllPostComments({
    user,
    post,
  }: {
    user: HUser;
    post: idType;
  }): Promise<IPaginate<IComment>> {
    const targetPost = await this.postRepository.findById({ id: post });
    if (!targetPost) {
      throw new NotfoundException("Post not found");
    }

    const postAuthor = await this.userRepository.findById({
      id: targetPost.author,
    });

    if (!postAuthor) {
      throw new NotfoundException("Author not found");
    }

    if (
      postAuthor.accountPrivacy === AccountPrivacyEnum.PRIVATE &&
      !user._id.equals(postAuthor._id)
    ) {
      const follow = await this.followRepository.findOne({
        filter: {
          followerId: user._id,
          followingId: postAuthor._id,
        },
      });

      if (!follow) {
        throw new NotfoundException("Post not found");
      }
    }

    const { docsCount, totalPages, limit, currentPage, docs } =
      await this.commentRepository.paginate({
        filter: {
          post,
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

  async getCommentById({
    user,
    post,
    commentId,
  }: {
    user: HUser;
    post: idType;
    commentId: idType;
  }): Promise<IComment> {
    const targetPost = await this.postRepository.findById({ id: post });
    if (!targetPost) {
      throw new NotfoundException("Post not found");
    }

    const postAuthor = await this.userRepository.findById({
      id: targetPost.author,
    });

    if (!postAuthor) {
      throw new NotfoundException("Author not found");
    }

    if (
      postAuthor.accountPrivacy === AccountPrivacyEnum.PRIVATE &&
      !user._id.equals(postAuthor._id)
    ) {
      const follow = await this.followRepository.findOne({
        filter: {
          followerId: user._id,
          followingId: postAuthor._id,
        },
      });

      if (!follow) {
        throw new NotfoundException("Post not found");
      }
    }

    const comment = await this.commentRepository.findById({
      id: commentId,
      options: {
        populate: {
          path: "author",
          select: "firstName lastName image",
        },
      },
    });

    if (!comment) {
      throw new NotfoundException("Comment not found");
    }

    return comment.toJSON();
  }

  async updateComment({
    user,
    commentId,
    update,
  }: {
    user: HUser;
    commentId: idType;
    update: IComment;
  }): Promise<IComment> {
    const comment = await this.commentRepository.findOneAndUpdate({
      filter: {
        _id: commentId,
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

    if (!comment) {
      throw new NotfoundException("Comment not found");
    }

    return comment.toJSON();
  }

  async deleteComment({
    user,
    commentId,
  }: {
    user: HUser;
    commentId: idType;
  }): Promise<string> {
    const { modifiedCount } = await this.commentRepository.updateOne({
      filter: {
        _id: commentId,
        author: user._id,
      },
      update: {
        status: CommentStatusEnum.ARCHIVED,
      },
    });

    if (!modifiedCount) {
      throw new NotfoundException("Comment not found");
    }

    return "Comment deleted successfully";
  }
}

export default new CommentService();
