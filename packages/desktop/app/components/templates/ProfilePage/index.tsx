import { FC } from "react";
import ProfileCard from "./ProfileCard";
import { useFetchPosts } from "mobile/src/graphql/query/account";
import CompaniesList from "./CompaniesList";
import PostsList from "../../common/PostsList";
import FundCard from "../../modules/funds/FundCard";
import { useFetchFunds } from "mobile/src/graphql/query/marketplace";
import { UserProfileProps } from "../../../types/common-props";

const ProfilePage: FC<UserProfileProps> = ({ user }: UserProfileProps) => {
  const { data: fundsData } = useFetchFunds();
  const { data: postsData } = useFetchPosts();
  return (
    <>
      <div className="lg:mt-12 mb-12 lg:px-14">
        <div className="lg:grid grid-cols-6 gap-8">
          <div className="col-span-4">
            <div className="divide-y divide-inherit border-white/[.12]">
              <div className="pb-5">
                <ProfileCard user={user} />
              </div>
              <div className="lg:hidden mb-5 pt-5">
                <CompaniesList companies={user.companies} />
              </div>
              {fundsData?.funds && fundsData.funds.length > 0 && (
                <div className="py-5">
                  {fundsData.funds.map((fund) => (
                    <div key={fund._id} className="mb-5">
                      <FundCard fund={fund} showImages={false} />
                    </div>
                  ))}
                </div>
              )}
              {postsData?.posts && (
                <div className="py-5">
                  <PostsList posts={postsData.posts} />
                </div>
              )}
            </div>
          </div>
          <div className="col-span-2 hidden lg:block">
            <CompaniesList companies={user.companies} />
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
