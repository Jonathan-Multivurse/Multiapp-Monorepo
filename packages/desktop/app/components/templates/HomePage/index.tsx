import { FC, useState } from "react";
import { Plus } from "phosphor-react";
import CompanyCard from "./CompanyCard";
import FeaturedProfessionals from "./FeaturedProfessionals";
import AddPost from "./AddPost";
import PostsList from "./PostsList";
import InviteFriends from "./InviteFriends";
import WatchList from "./WatchList";
import Button from "../../common/Button";
import CreatePostModal from "./AddPost/CreatePostModal";
import { useAccount } from "mobile/src/graphql/query/account";
import ProfileCardSmall from "../../modules/users/ProfileCardSmall";
import { useProfessionals } from "mobile/src/graphql/query/user/useProfessionals";

const HomePage: FC = () => {
  const [showPostModal, setShowPostModal] = useState(false);
  const { data: accountData } = useAccount();
  const { data: professionalsData } = useProfessionals(true);
  const user = accountData?.account;
  if (!user) {
    return <></>;
  }

  return (
    <>
      <div className="flex flex-row px-2 mt-10">
        <div className="w-80 hidden lg:block flex-shrink-0 mx-4">
          <ProfileCardSmall user={user} />
          {user.companies.length > 0 && (
            <div className="mt-12" key={user.companies[0]._id}>
              <CompanyCard company={user.companies[0]} />
            </div>
          )}
        </div>
        <div className="min-w-0 mx-4">
          <FeaturedProfessionals
            professionals={professionalsData?.professionals ?? []}
          />
          <div className="mt-10 hidden md:block">
            <AddPost setShowPostModal={() => setShowPostModal(true)} />
          </div>
          <div className="mt-5">
            <PostsList />
          </div>
        </div>
        <div className="w-80 hidden lg:block flex-shrink-0 mx-4">
          <InviteFriends />
          {user.watchlistIds && user.watchlistIds.length > 0 && (
            <div className="mt-5">
              <WatchList />
            </div>
          )}
        </div>
        <div className="block md:hidden absolute bottom-5 right-5">
          <Button
            variant="gradient-primary"
            className="w-12 h-12 rounded-full"
            onClick={() => setShowPostModal(true)}
          >
            <Plus color="white" size={24} />
          </Button>
        </div>
      </div>
      <CreatePostModal
        show={showPostModal}
        onClose={() => setShowPostModal(false)}
      />
    </>
  );
};

export default HomePage;
