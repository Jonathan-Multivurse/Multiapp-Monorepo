import { FC, useState, useEffect, useRef } from "react";
import {
  Buildings,
  User,
  X,
  GlobeHemisphereEast,
  CircleWavy,
  Image as ImageIcon,
  Smiley,
  CaretDown,
  XCircle,
} from "phosphor-react";
import Image from "next/image";
import { Picker } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";

import CategorySelector, { categoriesSchema } from "./CategorySelector";
import Avatar from "desktop/app/components/common/Avatar";
import Button from "desktop/app/components/common/Button";
import Input from "desktop/app/components/common/Input";
import Dropdown, {
  DropdownProps,
} from "desktop/app/components/common/Dropdown";
import Label from "desktop/app/components/common/Label";
import MentionTextarea, {
  mentionTextSchema,
} from "desktop/app/components/common/MentionTextarea";

import {
  SubmitHandler,
  useForm,
  Controller,
  DefaultValues,
} from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  useCreatePost,
  useFetchUploadLink,
} from "shared/graphql/mutation/posts";
import { Audience, PostCategory } from "backend/graphql/posts.graphql";
import { Audiences } from "backend/graphql/enumerations.graphql";
import { PostSummary } from "shared/graphql/fragments/post";
import { useEditPost } from "shared/graphql/mutation/posts/useEditPost";
import ModalDialog from "../../../common/ModalDialog";
import { useAccount } from "shared/graphql/query/account/useAccount";

const audienceOptions = [
  {
    icon: <GlobeHemisphereEast color="currentColor" weight="fill" size={24} />,
    title: "Everyone",
    value: "EVERYONE",
  },
  {
    icon: (
      <div className="text-success relative">
        <CircleWavy color="currentColor" weight="fill" size={24} />
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-bold scale-75 text-white">
          QP
        </div>
      </div>
    ),
    title: "Qualified Purchasers",
    value: "QUALIFIED_PURCHASER",
  },
  {
    icon: (
      <div className="text-success relative">
        <CircleWavy color="currentColor" weight="fill" size={24} />
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-bold scale-75 text-white">
          QC
        </div>
      </div>
    ),
    title: "Qualified Clients",
    value: "QUALIFIED_CLIENT",
  },
  {
    icon: (
      <div className="text-success relative">
        <CircleWavy color="currentColor" weight="fill" size={24} />
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-bold scale-75 text-white">
          AI
        </div>
      </div>
    ),
    title: "Accredited Investors",
    value: "ACCREDITED",
  },
];

type FormValues = {
  user: string;
  audience: Audience;
  mediaUrl?: string;
  categories: PostCategory[];
  mentionInput: {
    body?: string;
    mentions?: {
      id: string;
      name: string;
    }[];
  };
};

const schema = yup
  .object({
    user: yup.string().required("Required"),
    audience: yup
      .mixed()
      .oneOf<Audience>(Audiences)
      .default("EVERYONE")
      .required(),
    mediaUrl: yup.string().notRequired(),
    categories: categoriesSchema,
    mentionInput: mentionTextSchema,
  })
  .required();

interface EditPostModalProps {
  post?: PostSummary;
  show: boolean;
  onClose: () => void;
}

const EditPostModal: FC<EditPostModalProps> = ({ post, show, onClose }) => {
  const { data: { account } = {} } = useAccount({ fetchPolicy: "cache-only" });
  const [userOptions, setUserOptions] = useState<
    DropdownProps["items"][number][]
  >([]);
  const selectedFile = useRef<File | undefined>(undefined);
  const [localFileUrl, setLocalFileUrl] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(!!post);
  const [createPost] = useCreatePost();
  const [editPost] = useEditPost();
  const [fetchUploadLink] = useFetchUploadLink();
  const [loading, setLoading] = useState(false);
  const [visibleEmoji, setVisibleEmoji] = useState(false);
  const {
    handleSubmit,
    control,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: schema.cast({ categories: [] }) as DefaultValues<FormValues>,
    mode: "onChange",
  });

  useEffect(() => {
    if (account) {
      setUserOptions([
        {
          icon: <User color="currentColor" weight="fill" size={24} />,
          title: `${account.firstName} ${account.lastName}`,
          value: account._id,
        },
        ...account.companies.map((company) => ({
          icon: <Buildings color="currentColor" weight="fill" size={24} />,
          title: company.name,
          value: company._id,
        })),
      ]);
      if (post) {
        reset(
          schema.cast(
            {
              user: account._id == post.userId ? account._id : post.userId,
              mediaUrl: post.mediaUrl ?? "",
              categories: post.categories,
              mentionInput: {
                body: post.body,
              },
            },
          ) as DefaultValues<FormValues>,
        );
        setLocalFileUrl(
          post.mediaUrl
            ? `${process.env.NEXT_PUBLIC_POST_URL}/${post.mediaUrl}`
            : null,
        );
      } else {
        reset(schema.cast({ user: account._id }) as DefaultValues<FormValues>);
      }
    }
  }, [account, post, reset]);

  const onEmojiClick = (emojiObject: any) => {
    const body = getValues("mentionInput.body");
    setValue("mentionInput.body", body + emojiObject.native);
    setVisibleEmoji(false);
  };

  const onSubmit: SubmitHandler<FormValues> = async ({
    user,
    audience,
    mediaUrl,
    categories,
    mentionInput,
  }) => {
    setLoading(true);
    try {
      if (!post) {
        const { data } = await createPost({
          variables: {
            post: {
              audience,
              categories,
              mediaUrl,
              body: mentionInput.body,
              mentionIds: mentionInput.mentions?.map((mention) => mention.id),
              ...(user != account?._id ? { companyId: user } : {}),
            },
          },
        });
        if (data && data.createPost) {
          closeModal();
          return;
        }
      } else {
        const { data } = await editPost({
          variables: {
            post: {
              _id: post._id,
              userId: post.userId,
              audience,
              categories,
              mediaUrl,
              body: mentionInput.body,
              mentionIds: mentionInput.mentions?.map((mention) => mention.id),
            },
          },
        });
        if (data && data.editPost) {
          closeModal();
        }
      }
    } catch (err) {}
  };

  const uploadMedia = async (file: File): Promise<string | undefined> => {
    setLoading(true);
    setLocalFileUrl(URL.createObjectURL(file));

    const { data } = await fetchUploadLink({
      variables: {
        localFilename: file.name,
        type: "POST",
      },
    });

    if (!data || !data.uploadLink) {
      console.log("Error fetching upload link");
      return undefined;
    }

    const { remoteName, uploadUrl } = data.uploadLink;
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    });

    setLoading(false);
    return remoteName;
  };

  const closeModal = () => {
    onClose();
  };

  return (
    <ModalDialog
      className="w-full md:w-auto max-w-full md:h-[80vh] relative"
      show={show}
      onClose={() => {}}
    >
      <form className="h-full">
        <div className="h-full md:flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-white/[.12]">
            <div className="text-xl text-white font-medium">
              {post ? "Edit Post" : "Create Post"}
            </div>
            <Button variant="text">
              <X color="white" weight="bold" size={24} onClick={closeModal} />
            </Button>
          </div>
          <div className="flex flex-col md:flex-row flex-grow md:min-h-0">
            <div className="flex flex-col md:w-[40rem] relative">
              <div className="flex flex-wrap items-center p-4">
                <Avatar size={56} user={account} />
                <div className="ml-2">
                  <Dropdown items={userOptions} control={control} name="user" />
                </div>
                <div className="ml-2">
                  <Dropdown
                    items={audienceOptions}
                    control={control}
                    name="audience"
                  />
                </div>
              </div>
              <div className="mx-4 mt-2 caret-primary min-h-[100px] flex-grow">
                <MentionTextarea control={control} name="mentionInput" />
              </div>
              <div className="my-2">
                {localFileUrl && (
                  <div className="relative px-4">
                    <div className="h-64 relative">
                      <Image
                        alt=""
                        loader={() => localFileUrl}
                        src={localFileUrl}
                        layout="fill"
                        className="rounded-md"
                        objectFit="cover"
                        unoptimized={true}
                        onLoad={() => {
                          if (selectedFile.current) {
                            URL.revokeObjectURL(localFileUrl);
                          }
                        }}
                      />
                    </div>
                    <Button
                      variant="text"
                      className="absolute top-1 right-5 py-0"
                      onClick={() => {
                        if (selectedFile.current) {
                          selectedFile.current = undefined;
                          URL.revokeObjectURL(localFileUrl);
                        } else {
                          setValue("mediaUrl", undefined);
                        }
                        setLocalFileUrl(null);
                      }}
                    >
                      <XCircle size={32} color="#5F5F5F" weight="fill" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="mx-4 mt-2 mb-2">
                <div className="flex items-center">
                  <Controller
                    control={control}
                    name="mediaUrl"
                    render={({ field }) => (
                      <Input
                        id="image-select"
                        type="file"
                        value=""
                        onInput={async (evt) => {
                          const file = evt.currentTarget.files?.[0];
                          selectedFile.current = file;

                          if (file) {
                            const remoteFilename = await uploadMedia(file);
                            field.onChange(remoteFilename);
                          }
                        }}
                        className="hidden"
                        accept="image/*, video/*"
                      />
                    )}
                  />
                  <Label
                    htmlFor="image-select"
                    className="flex items-center cursor-pointer hover:opacity-80 transition"
                  >
                    <div className="text-purple-secondary">
                      <ImageIcon
                        color="currentColor"
                        weight="light"
                        size={24}
                      />
                    </div>
                    <div className="text-sm text-white/[.6] font-normal ml-2">
                      Photo/Video
                    </div>
                  </Label>
                  <div
                    className="flex items-center text-white/[.6] ml-4 cursor-pointer hover:opacity-80 transition"
                    onClick={() => setVisibleEmoji(!visibleEmoji)}
                  >
                    <div className="text-success">
                      <Smiley color="currentColor" weight="light" size={24} />
                    </div>
                    <div className="text-sm ml-2">Emoji</div>
                    <CaretDown
                      color="currentColor"
                      weight="bold"
                      size={16}
                      className="ml-1"
                    />
                  </div>
                </div>
              </div>
              {visibleEmoji && (
                <div className="absolute bottom-8 z-50">
                  <Picker onSelect={onEmojiClick} style={{ width: "100%" }} />
                </div>
              )}
            </div>
            {showCategories && (
              <div className="w-full md:border-l border-white/[.12] md:w-80">
                <CategorySelector
                  control={control}
                  name="categories"
                  error={
                    errors.categories
                      ? "Please select at least one category."
                      : ""
                  }
                />
              </div>
            )}
          </div>
          <div className="border-t border-white/[.12] flex items-center justify-between p-4">
            <Button
              variant="text"
              className="text-primary font-medium"
              onClick={closeModal}
            >
              Cancel
            </Button>
            {showCategories ? (
              <Button
                type="button"
                variant="gradient-primary"
                className="w-48 font-medium"
                loading={loading}
                onClick={() => handleSubmit(onSubmit)()}
              >
                {post ? "Save Updates" : "Post"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="gradient-primary"
                className="w-48 font-medium"
                loading={loading}
                onClick={() => setShowCategories(true)}
              >
                NEXT
              </Button>
            )}
          </div>
        </div>
      </form>
    </ModalDialog>
  );
};

export default EditPostModal;
