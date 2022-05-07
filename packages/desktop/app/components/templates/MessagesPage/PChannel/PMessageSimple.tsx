import React from "react";
import {
  MessageText,
  Attachment,
  Avatar,
  MessageDeleted,
  MessageOptions,
  MessageRepliesCountButton,
  MessageTimestamp,
  ReactionSelector,
  ReactionsList,
  useMessageContext,
  messageHasAttachments,
  messageHasReactions,
} from "stream-chat-react";
import { Check } from "phosphor-react";
import { StreamType } from "../types";

export const PMessageSimple = () => {
  const {
    endOfGroup,
    firstOfGroup,
    groupedByUser,
    handleAction,
    handleOpenThread,
    handleRetry,
    highlighted,
    isMyMessage,
    isReactionEnabled,
    message,
    onUserClick,
    onUserHover,
    reactionSelectorRef,
    showDetailedReactions,
    threadList,
  } = useMessageContext<StreamType>("MessageSimple");

  const hasAttachment = messageHasAttachments(message);
  const hasReactions = messageHasReactions(message);

  const messageClasses = isMyMessage()
    ? "str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me items-start"
    : "str-chat__message str-chat__message-simple items-start";

  if (message.deleted_at || message?.type === "deleted") {
    return <MessageDeleted message={message} />;
  }

  return (
    <>
      <div
        className={`
          ${messageClasses}
          str-chat__message--${message.type}
          str-chat__message--${message.status}
          ${message.text ? "str-chat__message--has-text" : "has-no-text"}
          ${hasAttachment ? "str-chat__message--has-attachment" : ""}
          ${
            hasReactions && isReactionEnabled
              ? "str-chat__message--with-reactions"
              : ""
          }
          ${highlighted ? "str-chat__message--highlighted" : ""}
          ${message.pinned ? "pinned-message" : ""}
          ${groupedByUser ? "str-chat__virtual-message__wrapper--group" : ""}
          ${firstOfGroup ? "str-chat__virtual-message__wrapper--first" : ""}
          ${endOfGroup ? "str-chat__virtual-message__wrapper--end" : ""}
        `.trim()}
        key={message.id}
      >
        {!isMyMessage() && message.user && (
          <Avatar
            image={message.user.image}
            name={message.user.name || message.user.id}
            onClick={onUserClick}
            onMouseOver={onUserHover}
            user={message.user}
            size={36}
          />
        )}
        <div
          className="str-chat__message-inner"
          data-testid="message-inner"
          onClick={
            message.status === "failed" && message.errorStatusCode !== 403
              ? () => handleRetry(message)
              : undefined
          }
          onKeyPress={
            message.status === "failed" && message.errorStatusCode !== 403
              ? () => handleRetry(message)
              : undefined
          }
        >
          <>
            <MessageOptions />
            {hasReactions && !showDetailedReactions && isReactionEnabled && (
              <ReactionsList reverse />
            )}
            {showDetailedReactions && isReactionEnabled && (
              <ReactionSelector ref={reactionSelectorRef} />
            )}
          </>
          {message.attachments?.length && !message.quoted_message ? (
            <Attachment
              actionHandler={handleAction}
              attachments={message.attachments}
            />
          ) : null}
          <MessageText message={message} />

          {!threadList && !!message.reply_count && (
            <div className="str-chat__message-simple-reply-button">
              <MessageRepliesCountButton
                onClick={handleOpenThread}
                reply_count={message.reply_count}
              />
            </div>
          )}
          {(!groupedByUser || endOfGroup) && (
            <div
              className={`
                flex items-center text-white text-sm
                ${isMyMessage() ? 'justify-end' : ''}
              `}
            >
              {isMyMessage() && message.status === 'received' && <Check color="white" size="20" />}
              &nbsp;
              <MessageTimestamp
                customClass="text-white/[.6]"
                format="h:mm A"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PMessageSimple;