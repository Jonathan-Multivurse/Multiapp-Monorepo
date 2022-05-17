import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useProfile } from "shared/graphql/query/user/useProfile";
import ProfilePage from "../../app/components/templates/ProfilePage";
import { NextPageWithLayout } from "../../app/types/next-page";

const Profile: NextPageWithLayout = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { userId } = router.query as Record<string, string>;
  const isMyProfile = userId == "me";
  const {
    data: { userProfile: user } = {},
    loading,
  } = useProfile(isMyProfile ? session?.user?._id : userId);
  const title = isMyProfile ? "My Profile - Prometheus" :
    `${user ? `${user.firstName} ${user.lastName}` : "Profile"} - Prometheus`;

  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ProfilePage user={user} isMyProfile={isMyProfile} loading={loading} />
    </div>
  );
};

Profile.layout = "main";
Profile.middleware = "auth";

export default Profile;
