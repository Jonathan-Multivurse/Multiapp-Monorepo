import { FC, useState } from "react";
import Image from "next/image";
import { DotsThreeOutlineVertical, Trash, Pen } from "phosphor-react";
import { Menu } from "@headlessui/react";
import moment from "moment";

import SendMessage from "../SendMessage";
import Button from "../../../../../common/Button";
import Avatar from "../../../../../common/Avatar";

import {
  useDeleteComment,
  useEditCommentPost,
  useCommentPost,
  useLikeComment,
} from "shared/graphql/mutation/posts";
import { useAccount } from "shared/graphql/query/account/useAccount";
import type { Comment } from "shared/graphql/query/post/usePost";

interface CommentItemProps extends React.PropsWithChildren<unknown> {
  comment: Comment;
  postId: string;
  parentId?: string;
  size?: number;
}

const CommentItem: FC<CommentItemProps> = ({
  comment,
  postId,
  size,
  parentId,
  children,
}: CommentItemProps) => {
  const { data: { account } = {} } = useAccount({ fetchPolicy: "cache-only" });
  const [likeComment] = useLikeComment();
  const [deleteComment] = useDeleteComment();
  const [editComment] = useEditCommentPost();
  const [commentPost] = useCommentPost();
  const [isEditable, setIsEditable] = useState(false);
  const [liked, setLiked] = useState(
    (account && comment.likeIds?.includes(account._id)) ?? false,
  );
  const [visibleReply, setVisibleReply] = useState(false);

  const toggleLike = async (): Promise<void> => {
    const toggled = !liked;
    const { data } = await likeComment({
      variables: { like: toggled, commentId: comment._id },
    });

    data && data.likeComment
      ? setLiked(toggled)
      : console.log("Error liking comment");
  };

  const handleDeleteComment = async (): Promise<void> => {
    try {
      await deleteComment({
        variables: { commentId: comment._id },
      });
    } catch (err) {
      console.log("delete comment", err);
    }
  };

  const handleEditComment = async (
    message: string,
    mediaUrl?: string,
  ): Promise<void> => {
    if ((!message || message.trim() === "") && !mediaUrl) return;
    try {
      const { data } = await editComment({
        variables: {
          comment: {
            _id: comment._id,
            body: message,
            mentionIds: [], // Implement mentions
            mediaUrl: mediaUrl ?? "",
          },
        },
      });
      if (data?.editComment) {
        setIsEditable(false);
      }
    } catch (err) {
    }
  };
  const handleReplyComment = async (
    reply: string,
    mediaUrl?: string,
  ): Promise<void> => {
    if ((!reply || reply.trim() === "") && !mediaUrl) return;
    try {
      setVisibleReply(false);
      await commentPost({
        variables: {
          comment: {
            body: reply,
            postId: postId,
            commentId: parentId,
            mentionIds: [], // Update to add mentions
            mediaUrl: mediaUrl ?? "",
          },
        },
      });
    } catch (err) {
    }
  };
  return (
    <>
      <div className="flex items-start">
        <Avatar user={comment.user} size={size ? size : 36} />
        <div className="ml-4 w-full">
          <div className="p-2 rounded-lg bg-background-popover">
            <div className="flex justify-between">
              <div>
                <div className="text text-sm text-white opacity-60">
                  {comment.user.firstName} {comment.user.lastName}
                </div>
                <div className="text text-xs text-white opacity-60">
                  {comment.user.position}
                  {comment.user.company?.name &&
                    `@ ${comment.user.company.name}`}
                  {(!!comment.user.position || comment.user.company?.name) &&
                    " • "}
                  {moment(comment.createdAt).fromNow()}
                </div>
              </div>
              {account?._id === comment.user._id && (
                <div className="flex items-center">
                  <Menu as="div" className="relative">
                    <Menu.Button>
                      <DotsThreeOutlineVertical
                        size={16}
                        weight="fill"
                        className="opacity-60"
                      />
                    </Menu.Button>
                    <Menu.Items className="z-10 absolute right-0 w-48 bg-background-popover shadow-md shadow-black rounded">
                      <div className="py-2">
                        <div
                          className="flex items-center text-sm text-white cursor-pointer hover:bg-background-blue px-4 py-3"
                          onClick={handleDeleteComment}
                        >
                          <Trash size={16} />
                          <span className="text-sm ml-3">Delete</span>
                        </div>
                        <div
                          className="flex items-center text-sm text-white cursor-pointer hover:bg-background-blue px-4 py-3"
                          onClick={() => setIsEditable(true)}
                        >
                          <Pen size={18} color="currentColor" />
                          <span className="text-sm ml-3">Edit</span>
                        </div>
                      </div>
                    </Menu.Items>
                  </Menu>
                </div>
              )}
            </div>
            {isEditable ? (
              <SendMessage
                onSend={(val, mediaUrl) => handleEditComment(val, mediaUrl)}
                placeholder="Edit comment..."
                message={comment.body}
                user={account}
                avatarSize={24}
              />
            ) : (
              <div className="text text-sm text-white mt-4 flex flex-col">
                <span>{comment.body}</span>
                {comment.mediaUrl && (
                  <div className="overflow-hidden flex h-80 relative mt-4 rounded-xl">
                    <Image
                      loader={() =>
                        `${process.env.NEXT_PUBLIC_POST_URL}/${comment.mediaUrl}`
                      }
                      src={`${process.env.NEXT_PUBLIC_POST_URL}/${comment.mediaUrl}`}
                      alt=""
                      layout="fill"
                      objectFit="cover"
                      unoptimized={true}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mb-4 ml-2">
            <div className="flex items-center">
              <Button variant="text" onClick={toggleLike}>
                <div className="text text-xs text-white font-medium tracking-wide">
                  Like
                </div>
              </Button>
              <Button
                variant="text"
                className="ml-4"
                onClick={() => setVisibleReply(true)}
              >
                <div className="text text-xs text-white font-medium tracking-wide">
                  Reply
                </div>
              </Button>
            </div>
            {comment.likeIds && comment.likeIds.length > 0 && (
              <div className="text text-xs text-white opacity-60">
                {comment.likeIds?.length ?? 0}{" "}
                {comment.likeIds?.length === 1 ? "Like" : "Likes"}
              </div>
            )}
          </div>
          <div className="child-list">{children}</div>
        </div>
      </div>
      {visibleReply && (
        <SendMessage
          user={account}
          avatarSize={24}
          onSend={(val, mediaUrl) => handleReplyComment(val, mediaUrl)}
          placeholder="Reply comment..."
        />
      )}
    </>
  );
};

export default CommentItem;