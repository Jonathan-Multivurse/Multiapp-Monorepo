import { FC } from "react";
import UserItem from "../../../../modules/users/UserItem";
import Button from "../../../../common/Button";
import Card from "../../../../common/Card";
import { GlobalSearchData } from "shared/graphql/query/search/useGlobalSearch";
import { useFollowUser } from "shared/graphql/mutation/account/useFollowUser";
import { useAccount } from "shared/graphql/query/account/useAccount";

interface ItemViewProps {
  user: GlobalSearchData["globalSearch"]["users"][number];
}

const ItemView: FC<ItemViewProps> = ({ user }) => {
  const { data: { account } = {} } = useAccount({ fetchPolicy: "cache-only" });
  const { isFollowing, toggleFollow } = useFollowUser(user._id);
  const isMyProfile = account?._id == user._id;

  return (
    <>
      <Card className="bg-background-header border-none rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-grow flex-shrink-0">
            <UserItem user={user} showFollow={false} />
          </div>
          {!isMyProfile && !isFollowing &&
            <Button
              variant="text"
              className="text-sm text-primary font-medium"
              onClick={toggleFollow}
            >
              Follow
            </Button>
          }
        </div>
      </Card>
    </>
  );
};

export default ItemView;