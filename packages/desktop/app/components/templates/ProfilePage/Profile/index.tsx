import { FC, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DotsThreeOutlineVertical,
  Share,
  LinkedinLogo,
  TwitterLogo,
  Globe,
  Chats,
  Copy,
  Users,
  WarningCircle,
  MinusCircle,
} from "phosphor-react";
import { Menu } from "@headlessui/react";

import Button from "../../../../components/common/Button";
import Card from "../../../../components/common/Card";
import SearchModal from "../SearchModal";
import type { Company } from "backend/graphql/companies.graphql";
import type { User } from "backend/graphql/users.graphql";
import { useAccount } from "desktop/app/graphql/queries";

const Profile: FC = () => {
  const [isVisible, setVisible] = useState(false);
  const { data: userData, loading: userLoading } = useAccount();
  const account = userData?.account;

  if (!account) {
    return null;
  }

  return (
    <>
      <div className="relative mb-2">
        <Card className="border-0 p-0 rounded-none md:rounded-2xl">
          <div className="w-full h-32 relative">
            <Image
              loader={() =>
                `${process.env.NEXT_PUBLIC_POST_URL}/${account.background?.url}`
              }
              src={`${process.env.NEXT_PUBLIC_POST_URL}/${account.background?.url}`}
              alt=""
              layout="fill"
              objectFit="cover"
            />
          </div>

          <div className="flex flex-col  items-baseline justify-between px-4 pt-4 -mt-12 md:flex-row md:items-center">
            <div className="flex items-center">
              <div className="w-24 h-24 flex justify-center relative shadow-2xl shadow-black rounded-full">
                <Image
                  loader={() =>
                    `${process.env.NEXT_PUBLIC_AVATAR_URL}/${account.avatar}`
                  }
                  src={`${process.env.NEXT_PUBLIC_AVATAR_URL}/${account.avatar}`}
                  alt=""
                  width={96}
                  height={96}
                  className="rounded-full"
                  unoptimized={true}
                  objectFit="fill"
                />
              </div>
              <div className="ml-2">
                <div className="flex items-center">
                  <div className="text-white">
                    {account.firstName} {account.lastName}{" "}
                  </div>
                </div>
                <div className="text-xs text-white opacity-60">
                  {account.role}
                </div>
                <div className="text-xs text-primary">{account.position}</div>
              </div>
            </div>
            <Button
              variant="gradient-primary"
              className="w-full h-10	mt-4 uppercase tracking-normal font-normal py-0 md:w-44"
            >
              FOLLOW
            </Button>
          </div>

          <div className="flex items-center flex-col-reverse md:flex-row my-4">
            <div className="text-sm text-white opacity-90 px-4 w-full">
              {account.accreditation}
            </div>
            <div className="w-full my-4 grid grid-cols-3 divide-x md:w-72 flex-shrink-0">
              <div className="text-center">
                <div>{account.postIds?.length ?? 0}</div>
                <div className="text-xs text-white opacity-60">Posts</div>
              </div>
              <div
                className="text-center cursor-pointer"
                onClick={() => setVisible(true)}
              >
                <div>{account.followerIds?.length ?? 0}</div>
                <div className="text-xs text-white opacity-60">Followers</div>
              </div>
              <div
                className="text-center  cursor-pointer"
                onClick={() => setVisible(true)}
              >
                <div>{account.followingIds?.length ?? 0}</div>
                <div className="text-xs text-white opacity-60">Following</div>
              </div>
            </div>
          </div>

          <div className="flex items-center p-4 border-t border-white/[.12]">
            <div className="flex items-center cursor-pointer mr-4">
              <Link href={account.linkedIn ?? "/blank"}>
                <a className="flex items-center">
                  <LinkedinLogo size={24} weight="fill" />
                  <div className="text-primary ml-2 hidden md:block">
                    Linkedin
                  </div>
                </a>
              </Link>
            </div>
            <div className="flex items-center cursor-pointer mr-4">
              <Link href={account.twitter ?? "/blank"}>
                <a className="flex items-center">
                  <TwitterLogo size={24} weight="fill" />
                  <div className="text-primary ml-2 hidden md:block">
                    Twitter
                  </div>
                </a>
              </Link>
            </div>

            <div className="flex items-center cursor-pointer">
              <Link href={account.website ?? "/blank"}>
                <a className="flex items-center">
                  <Globe size={24} weight="fill" className="hidden md:block" />
                  <div className="text-primary ml-2">Website</div>
                </a>
              </Link>
            </div>
          </div>
        </Card>
        <div className="ml-auto flex items-center absolute right-4 bottom-2">
          <Menu as="div" className="relative">
            <Menu.Button>
              <DotsThreeOutlineVertical size={24} className="opacity-60" />
            </Menu.Button>
            <Menu.Items className="z-10	absolute right-0 w-64 bg-surface-light10 shadow-md shadow-black rounded">
              <Menu.Item>
                <div className="divide-y border-white/[.12] divide-inherit pb-2">
                  <div className="flex items-center p-4">
                    <Button variant="text" className="py-0">
                      <Users size={24} />
                      <span className="ml-4">View All Followers</span>
                    </Button>
                  </div>
                  <div className="flex items-center p-4">
                    <Button variant="text" className="py-0">
                      <MinusCircle size={24} />
                      <span className="ml-4">Hide User</span>
                    </Button>
                  </div>
                  <div className="flex items-center p-4">
                    <Button variant="text" className="py-0">
                      <WarningCircle size={24} />
                      <span className="ml-4">Report Profile</span>
                    </Button>
                  </div>
                  <div className="flex items-center p-4">
                    <Button variant="text" className="py-0">
                      <Copy size={24} />
                      <span className="ml-4">Copy Profile Link</span>
                    </Button>
                  </div>
                </div>
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
      <SearchModal show={isVisible} onClose={() => setVisible(false)} />
    </>
  );
};

export default Profile;
