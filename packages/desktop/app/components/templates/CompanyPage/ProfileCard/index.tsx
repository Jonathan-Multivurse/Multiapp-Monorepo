import { FC, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DotsThreeOutlineVertical,
  LinkedinLogo,
  TwitterLogo,
  Globe,
  Copy,
  Chats,
  Share,
} from "phosphor-react";
import { Menu } from "@headlessui/react";
import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import { CompanyProfileProps } from "../../../../types/common-props";
import FollowersModal from "desktop/app/components/modules/users/FollowersModal";
import { useFollowCompany } from "mobile/src/graphql/mutation/account";
import { useAccount } from "mobile/src/graphql/query/account";

const ProfileCard: FC<CompanyProfileProps> = ({ company }: CompanyProfileProps) => {
  const { data: accountData } = useAccount({ fetchPolicy: "cache-only" });
  const [isVisible, setVisible] = useState(false);
  let overviewShort: string | undefined = undefined;
  const [showFullOverView, setShowFullOverView] = useState(false);
  {
    const regexpSpace = /\s/g;
    const result = company.overview?.matchAll(regexpSpace);
    if (result) {
      const matches = Array.from(result);
      const wordsToSplit = 20;
      if (matches.length > wordsToSplit) {
        overviewShort = company.overview?.substring(
          0,
          matches[wordsToSplit].index!,
        );
      }
    }
  }
  const [followCompany] = useFollowCompany();
  const isFollowing =
    accountData?.account?.companyFollowingIds?.includes(company._id) ?? false;
  const toggleFollowCompany = async () => {
    try {
      await followCompany({
        variables: { follow: !isFollowing, companyId: company._id },
        refetchQueries: ["Account"],
      });
    } catch (err) {
    }
  };
  return (
    <>
      <div className="relative">
        <Card className="rounded-none lg:rounded-2xl border-brand-overlay/[.1] p-0">
          <div>
            <div className="w-full h-16 lg:h-32 bg-white/[.25] relative">
              {company.background && (
                <Image
                  loader={() =>
                    `${process.env.NEXT_PUBLIC_BACKGROUND_URL}/${company.background?.url}`
                  }
                  src={`${process.env.NEXT_PUBLIC_BACKGROUND_URL}/${company.background?.url}`}
                  alt=""
                  layout="fill"
                  objectFit="cover"
                  unoptimized={true}
                />
              )}
            </div>
            <div className="hidden lg:flex relative mx-5">
              <div className="w-[120px] h-[120px] bg-background rounded-2xl relative overflow-hidden -mt-12">
                {company.avatar && (
                  <Image
                    loader={() =>
                      `${process.env.NEXT_PUBLIC_AVATAR_URL}/${company.avatar}`
                    }
                    src={`${process.env.NEXT_PUBLIC_AVATAR_URL}/${company.avatar}`}
                    alt=""
                    layout="fill"
                    objectFit="cover"
                    unoptimized={true}
                  />
                )}
              </div>
              <div className="flex flex-grow justify-between ml-4 mt-4">
                <div>
                  <div className="text-xl text-white font-medium">
                    {company.name}
                  </div>
                </div>
                <div className="flex items-center">
                  <Button
                    variant="gradient-primary"
                    className="w-40 text-sm font-medium"
                    onClick={() => toggleFollowCompany()}
                  >
                    {isFollowing ? "UNFOLLOW" : "FOLLOW"}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex lg:hidden items-center p-4">
              <div className="w-20 h-20 bg-background rounded-2xl relative overflow-hidden -mt-12">
                {company.avatar && (
                  <Image
                    loader={() =>
                      `${process.env.NEXT_PUBLIC_AVATAR_URL}/${company.avatar}`
                    }
                    src={`${process.env.NEXT_PUBLIC_AVATAR_URL}/${company.avatar}`}
                    alt=""
                    layout="fill"
                    objectFit="cover"
                    unoptimized={true}
                  />
                )}
              </div>
              <div className="flex-grow grid grid-cols-3 divide-x divide-inherit">
                <div className="flex flex-wrap items-center justify-center text-center cursor-pointer px-4">
                  <div className="text-xl text-white font-medium mx-1">
                    {company.postIds?.length ?? 0}
                  </div>
                  <div className="text-xs text-white opacity-60 mx-1">Posts</div>
                </div>
                <div
                  className="flex flex-wrap items-center justify-center text-center cursor-pointer px-4"
                  onClick={() => setVisible(true)}
                >
                  <div className="text-xl text-white font-medium mx-1">
                    {company.followerIds?.length ?? 0}
                  </div>
                  <div className="text-xs text-white opacity-60 mx-1">Followers</div>
                </div>
                <div
                  className="flex flex-wrap items-center justify-center text-center cursor-pointer px-4"
                  onClick={() => setVisible(true)}
                >
                  <div className="text-xl text-white font-medium mx-1">
                    {company.followingIds?.length ?? 0}
                  </div>
                  <div className="text-xs text-white opacity-60 mx-1">Following</div>
                </div>
              </div>
            </div>
            <div className="lg:hidden mt-1 mx-4">
              <div className="text-white">
                {company.name}
              </div>
            </div>
            <div className="lg:grid grid-cols-2 mx-4 mt-5 lg:mt-5 mb-5">
              <div className="text-sm text-white">
                <div>{company.tagline}</div>
                <div className="mt-3">
                  {!overviewShort && <div>{company.overview}</div>}
                  {overviewShort && !showFullOverView && (
                    <div>
                      {overviewShort} ...
                      <span
                        className="text-primary cursor-pointer ml-1"
                        onClick={() => setShowFullOverView(true)}
                      >
                        More
                      </span>
                    </div>
                  )}
                  {overviewShort && showFullOverView && (
                    <div>
                      <div>{company.overview}</div>
                      <div>
                        <span
                          className="text-primary cursor-pointer"
                          onClick={() => setShowFullOverView(false)}
                        >
                          Show Less
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden lg:flex items-baseline justify-end">
                <div className="flex items-center divide-x divide-inherit border-white/[.12]">
                  <div className="text-center px-4">
                    <div className="text-xl text-white font-medium">
                      {company.postIds?.length ?? 0}
                    </div>
                    <div className="text-xs text-white opacity-60">Posts</div>
                  </div>
                  <div
                    className="text-center cursor-pointer px-4"
                    onClick={() => setVisible(true)}
                  >
                    <div className="text-xl text-white font-medium">
                      {company.followerIds?.length ?? 0}
                    </div>
                    <div className="text-xs text-white opacity-60">
                      Followers
                    </div>
                  </div>
                  <div
                    className="text-center cursor-pointer px-4"
                    onClick={() => setVisible(true)}
                  >
                    <div className="text-xl text-white font-medium">
                      {company.followingIds?.length ?? 0}
                    </div>
                    <div className="text-xs text-white opacity-60">
                      Following
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:hidden mt-3 mb-5 px-4">
              <Button
                variant="gradient-primary"
                className="w-full text-sm font-medium"
                onClick={() => toggleFollowCompany()}
              >
                {isFollowing ? "UNFOLLOW" : "FOLLOW"}
              </Button>
            </div>
            <div className="flex items-center p-4 border-t border-white/[.12]">
              <div className="flex items-center cursor-pointer">
                <Link href={company.linkedIn ?? "/"}>
                  <a className="flex items-center text-white">
                    <LinkedinLogo
                      color="currentColor"
                      size={24}
                      weight="fill"
                    />
                    <div className="text-sm text-primary ml-1 hidden md:block">
                      Linkedin
                    </div>
                  </a>
                </Link>
              </div>
              <div className="flex items-center cursor-pointer ml-8">
                <Link href={company.twitter ?? "/"}>
                  <a className="flex items-center text-white">
                    <TwitterLogo color="currentColor" size={24} weight="fill" />
                    <div className="text-sm text-primary ml-1 hidden md:block">
                      Twitter
                    </div>
                  </a>
                </Link>
              </div>
              <div className="flex items-center cursor-pointer ml-8">
                <Link href={company.website ?? "/"}>
                  <a className="flex items-center text-white">
                    <Globe color="currentColor" size={24} weight="fill" />
                    <div className="text-sm text-primary ml-2">Website</div>
                  </a>
                </Link>
              </div>
              <div className="ml-auto">
                <Menu>
                  <Menu.Button>
                    <div className="flex items-center">
                      <DotsThreeOutlineVertical
                        color="#808080"
                        size={24}
                        weight="fill"
                      />
                    </div>
                  </Menu.Button>
                  <Menu.Items className="z-10	absolute right-0 w-44 bg-surface-light10 shadow-md shadow-black rounded">
                    <Menu.Item>
                      <div className="divide-y border-white/[.12] divide-inherit py-2">
                        <div className="flex items-center text-sm text-white cursor-pointer px-2.5 py-1.5">
                          <Chats color="currentColor" size={24} />
                          <span className="ml-4">Message</span>
                        </div>
                        <div className="flex items-center text-sm text-white cursor-pointer px-2.5 py-1.5">
                          <Share color="currentColor" size={24} />
                          <span className="ml-4">Share</span>
                        </div>
                        <div className="flex items-center text-sm text-white cursor-pointer px-2.5 py-1.5">
                          <Copy color="currentColor" size={24} />
                          <span className="ml-4">Copy Link</span>
                        </div>
                      </div>
                    </Menu.Item>
                  </Menu.Items>
                </Menu>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <FollowersModal
        show={isVisible}
        onClose={() => setVisible(false)}
        followers={company.followers}
        following={company.following}
      />
    </>
  );
};

export default ProfileCard;
