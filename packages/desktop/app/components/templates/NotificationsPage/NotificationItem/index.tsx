import React, { FC } from "react";
import {
  ChatCenteredText,
  ThumbsUp,
  UserCirclePlus,
} from "phosphor-react";
import moment from "moment";

import { Notification } from "backend/graphql/notifications.graphql";
import Avatar from "../../../common/Avatar";

interface NotificationItemProps {
  notification: Notification;
  handleReadNotification: (id: string) => void;
}

const NotificationItem: FC<NotificationItemProps> = ({
  notification,
  handleReadNotification,
}) => {
  let notificationIcon;
  if (notification.type == "COMMENT_POST") {
    notificationIcon = <ChatCenteredText size={16} />;
  } else if (notification.type == "LIKE_POST") {
    notificationIcon = <ThumbsUp size={16} />;
  } else if (notification.type == "FOLLOWED_BY_USER") {
    notificationIcon = <UserCirclePlus size={16} />;
  } else if (notification.type == "FOLLOWED_BY_COMPANY") {
    notificationIcon = <UserCirclePlus size={16} />;
  }

  return (
    <div
      className={`${notification.isNew && "bg-background-blue"}`}
      onClick={() =>
        notification.isNew && handleReadNotification(notification._id)
      }
    >
      <div className="flex items-center cursor-pointer py-3">
        <div className={notification.isNew ? "" : "invisible"}>
          <div className="w-2 h-2 rounded-full bg-yellow ml-2" />
        </div>
        <div className="relative ml-2">
          <Avatar user={notification.user} size={48} className="pl-3" />
          <div className="absolute -bottom-1 -right-1 rounded-full bg-purple-secondary p-1">
            {notificationIcon}
          </div>
        </div>
        <div className="text-sm flex-grow ml-3">
          <div className={notification.isNew ? "font-bold" : "font-normal"}>
            {notification.body}
          </div>
        </div>
        <div className="text-xs text-white flex-shrink-0 opacity-60 ml-3 mr-6">
          {moment(notification.createdAt).fromNow()}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;