import React, { useState, useMemo, useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePicker, {
  ImageOrVideo,
  Image as UploadImage,
} from 'react-native-image-crop-picker';
import RadioGroup, { Option } from 'react-native-radio-button-group';
import {
  MentionInput,
  MentionSuggestionsProps,
  replaceMentionValues,
} from 'react-native-controlled-mentions';
import _ from 'lodash';
import {
  Camera,
  VideoCamera,
  Image as GalleryImage,
  CirclesFour,
} from 'phosphor-react-native';
const Buffer = global.Buffer || require('buffer').Buffer;

import { POST_URL } from 'react-native-dotenv';

import UserSvg from 'shared/assets/images/user.svg';
import GlobalSvg from 'shared/assets/images/global.svg';
import AISvg from 'shared/assets/images/AI.svg';
import QPSvg from 'shared/assets/images/QP.svg';
import QCSvg from 'shared/assets/images/QC.svg';

import Avatar from 'mobile/src/components/common/Avatar';
import PAppContainer from 'mobile/src/components/common/PAppContainer';
import PLabel from 'mobile/src/components/common/PLabel';
import IconButton from 'mobile/src/components/common/IconButton';
import UserInfo from 'mobile/src/components/common/UserInfo';
import PModal from 'mobile/src/components/common/PModal';
import { showMessage } from 'mobile/src/services/utils';
import pStyles from 'mobile/src/theme/pStyles';
import {
  GRAY3,
  SECONDARY,
  WHITE60,
  DISABLED,
  PRIMARY,
  PRIMARYSOLID7,
  PRIMARYSOLID,
  WHITE,
  WHITE12,
  BGDARK,
} from 'shared/src/colors';

import {
  useForm,
  DefaultValues,
  Controller,
  useController,
} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAccount } from 'shared/graphql/query/account/useAccount';
import { useUsers, User } from 'shared/graphql/query/user/useUsers';
import { useFetchUploadLink } from 'shared/graphql/mutation/posts';

import type { Audience } from 'shared/graphql/query/post/usePosts';
import { Audiences } from 'backend/graphql/enumerations.graphql';

import PostHeader from './PostHeader';
import PostSelection from './PostSelection';

import { CreatePostScreen } from 'mobile/src/navigations/PostDetailsStack';

const RadioBodyView = (props: any) => {
  const { icon, label } = props;
  return (
    <View style={styles.radioBodyWrapper}>
      {icon}
      <PLabel label={label} viewStyle={styles.radioBodyTextStyle} />
    </View>
  );
};

export const AUDIENCE_OPTIONS: Option<Audience>[] = [
  {
    id: 'EVERYONE',
    value: 'Everyone',
    labelView: (
      <RadioBodyView
        icon={<GlobalSvg width={24} height={24} />}
        label="Everyone"
      />
    ),
  },
  {
    id: 'ACCREDITED',
    value: 'Accredited Investors',
    labelView: (
      <RadioBodyView
        icon={<AISvg width={24} height={24} />}
        label="Accredited Investors"
      />
    ),
  },
  {
    id: 'QUALIFIED_PURCHASER',
    value: 'Qualified Purchasers',
    labelView: (
      <RadioBodyView
        icon={<QPSvg width={24} height={24} />}
        label="Qualified Purchasers"
      />
    ),
  },
  {
    id: 'QUALIFIED_CLIENT',
    value: 'Qualified Clients',
    labelView: (
      <RadioBodyView
        icon={<QCSvg width={24} height={24} />}
        label="Qualified Clients"
      />
    ),
  },
];

type FormValues = {
  userId: string;
  audience: Audience;
  mediaUrl?: string;
  body?: string;
  mentionIds: string[];
};

const schema = yup
  .object({
    userId: yup.string().required('Required'),
    audience: yup
      .mixed()
      .oneOf<Audience>(Audiences)
      .default('EVERYONE')
      .required(),
    mediaUrl: yup.string().notRequired(),
    body: yup
      .string()
      .notRequired()
      .when('mediaUrl', {
        is: (mediaUrl?: string) => !mediaUrl || mediaUrl.length === 0,
        then: yup.string().required('Required'),
      }),
    mentionIds: yup
      .array()
      .of(yup.string().required().default(''))
      .ensure()
      .default([]),
  })
  .required();

const CreatePost: CreatePostScreen = ({ navigation, route }) => {
  const { post } = route.params;

  const { data: { account } = {} } = useAccount({ fetchPolicy: "cache-only" });
  const { data: usersData } = useUsers();
  const [fetchUploadLink] = useFetchUploadLink();

  const [postAsModalVisible, setPostAsModalVisible] = useState(false);
  const [audienceModalVisible, setAudienceModalVisible] = useState(false);
  const [imageData, setImageData] = useState<ImageOrVideo | undefined>(
    undefined,
  );

  const users = usersData?.users ?? [];
  const companies = account?.companies ?? [];

  const {
    handleSubmit,
    setValue,
    control,
    formState: { isValid },
  } = useForm<yup.InferType<typeof schema>>({
    resolver: yupResolver(schema),
    defaultValues: schema.cast(
      post
        ? {
            userId: post.userId,
            body: post.body ?? '',
            audience: post.audience,
            mediaUrl: post.mediaUrl ?? undefined,
            mentionIds: post.mentionIds ?? [],
          }
        : { user: account?._id },
      { assert: false, stripUnknown: true },
    ) as DefaultValues<FormValues>,
    mode: 'onChange',
  });

  useEffect(() => {
    if (account && !post?._id) {
      setValue('userId', account._id);
    }
  }, [account]);

  const { field: mediaField } = useController({ name: 'mediaUrl', control });
  const { field: mentionsField } = useController({
    name: 'mentionIds',
    control,
  });

  const onSubmit = (values: FormValues): void => {
    if (!account) return;

    const { userId, audience, body, mediaUrl, mentionIds } = values;
    navigation.navigate('ChooseCategory', {
      ...(post ?? {}),
      userId,
      audience,
      // TODO: Remove this and keep original body text. Add components that
      // automatically parse this text in the post view and add links to
      // their profile page.
      body: replaceMentionValues(body ?? '', ({ name }) => `@${name}`),
      mediaUrl,
      localMediaPath: imageData?.path,
      mentionIds, // TODO: Parse from body and add here
    });
  };

  const openPicker = async (): Promise<void> => {
    const imageData = await ImagePicker.openPicker({
      width: 300,
      height: 400,
      cropping: true,
      includeBase64: true,
    });

    await uploadImage(imageData);
  };

  const takePhoto = async (): Promise<void> => {
    const imageData = await ImagePicker.openCamera({
      width: 300,
      height: 400,
      cropping: false, // cropping caused error
      includeBase64: true,
    });

    await uploadImage(imageData);
  };

  const takeVideo = async (): Promise<void> => {
    const videoData = await ImagePicker.openCamera({
      mediaType: 'video',
    });

    await uploadImage(videoData);
  };

  const uploadImage = async (imageData: ImageOrVideo): Promise<void> => {
    const extension = imageData.mime.substring(
      imageData.mime.lastIndexOf('/') + 1,
    );

    let filename = imageData.filename ?? `image.${extension}`;

    // Rename file extension if it an HEIC format on iOS
    filename = filename.toLowerCase();
    if (filename.endsWith('.heic')) {
      filename = filename.replace('.heic', '.jpg');
    }

    const { data } = await fetchUploadLink({
      variables: {
        localFilename: filename,
        type: 'POST',
      },
    });

    if (!data || !data.uploadLink) {
      showMessage('error', 'Image upload failed');
      return;
    }

    const rawData = (imageData as UploadImage).data;
    if (!rawData) {
      showMessage('error', 'Only images supported at this time');
      return;
    }

    const { remoteName, uploadUrl } = data.uploadLink;
    const buffer = new Buffer(
      rawData.replace(/^data:image\/\w+;base64,/, ''),
      'base64',
    );

    const result = await fetch(uploadUrl, {
      method: 'PUT',
      body: buffer,
    });

    if (!result.ok) {
      showMessage('error', 'Image upload failed');
      return;
    }

    mediaField.onChange(remoteName);
    setImageData(imageData);
  };

  const postAsData: Option[] = [
    {
      id: account?._id ?? '',
      value: `${account?.firstName} ${account?.lastName}`,
      labelView: (
        <RadioBodyView
          icon={<Avatar user={account} size={32} />}
          label={`${account?.firstName} ${account?.lastName}`}
        />
      ),
    },
    ...companies.map((company) => ({
      id: company._id,
      value: company.name,
      labelView: (
        <RadioBodyView
          icon={
            <Avatar
              user={{
                avatar: company.avatar,
                firstName: company.name,
                lastName: '',
              }}
              size={32}
            />
          }
          label={company.name}
        />
      ),
    })),
  ];

  const renderSuggestions: (
    users: User[],
  ) => React.FC<MentionSuggestionsProps> =
    (users) =>
    ({ keyword, onSuggestionPress }) => {
      if (keyword == null) {
        return null;
      }

      const usersData = users.map((user) => ({
        ...user,
        name: `${user.firstName} ${user.lastName}`,
      }));

      return (
        <View style={styles.mentionList}>
          {usersData
            .filter((user) =>
              user.name
                .toLocaleLowerCase()
                .includes(keyword.toLocaleLowerCase()),
            )
            .map((user) => (
              <Pressable
                key={user._id}
                onPress={() => {
                  onSuggestionPress({ id: user._id, name: user.name });
                  mentionsField.onChange(
                    Array.from(new Set([...mentionsField.value, user._id])),
                  );
                }}
                style={styles.mentionItem}>
                <UserInfo user={user} />
              </Pressable>
            ))}
        </View>
      );
    };

  const renderMentionSuggestions = useMemo(
    () => renderSuggestions(users),
    [users],
  );

  return (
    <View style={pStyles.globalContainer}>
      <PostHeader
        centerLabel="Create Post"
        rightLabel="NEXT"
        rightValidation={isValid}
        handleNext={handleSubmit(onSubmit)}
        handleBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <PAppContainer
          disableKeyboardScroll
          contentContainerStyle={styles.flex}>
          <View style={styles.usersPart}>
            <Avatar user={account} size={32} />
            <Controller
              control={control}
              name="userId"
              render={({ field }) => (
                <>
                  <PostSelection
                    icon={<UserSvg />}
                    label={
                      postAsData.find((option) => option.id === field.value)
                        ?.value ?? ''
                    }
                    viewStyle={{ marginHorizontal: 8 }}
                    onPress={() => setPostAsModalVisible(true)}
                  />
                  <PModal
                    isVisible={postAsModalVisible}
                    title="Post As"
                    subTitle="You can post as yourself or a company you manage.">
                    <View style={styles.radioGroupStyle}>
                      <RadioGroup
                        options={postAsData}
                        activeButtonId={field.value}
                        circleStyle={styles.radioCircle}
                        onChange={(option) => field.onChange(option.id)}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => setPostAsModalVisible(false)}
                      style={styles.doneBtn}>
                      <PLabel label="DONE" />
                    </TouchableOpacity>
                  </PModal>
                </>
              )}
            />
            <Controller
              control={control}
              name="audience"
              render={({ field }) => (
                <>
                  <PostSelection
                    icon={<GlobalSvg />}
                    label={
                      AUDIENCE_OPTIONS.find(
                        (option) => option.id === field.value,
                      )?.value ?? ''
                    }
                    onPress={() => setAudienceModalVisible(true)}
                  />
                  <PModal
                    isVisible={audienceModalVisible}
                    title="Audience"
                    subTitle="Who can see your post?">
                    <View style={styles.radioGroupStyle}>
                      <RadioGroup
                        options={AUDIENCE_OPTIONS}
                        activeButtonId={field.value}
                        circleStyle={styles.radioCircle}
                        onChange={(option) => field.onChange(option.id)}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => setAudienceModalVisible(false)}
                      style={styles.doneBtn}>
                      <PLabel label="DONE" />
                    </TouchableOpacity>
                  </PModal>
                </>
              )}
            />
          </View>
          <Controller
            control={control}
            name="body"
            render={({ field }) => (
              <MentionInput
                keyboardAppearance="dark"
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Create a post"
                placeholderTextColor={WHITE60}
                style={styles.mentionInput}
                containerStyle={styles.mentionContainer}
                partTypes={[
                  {
                    isBottomMentionSuggestionsRender: true,
                    isInsertSpaceAfterMention: true,
                    trigger: '@',
                    renderSuggestions: renderMentionSuggestions,
                    textStyle: {
                      color: SECONDARY,
                    },
                  },
                ]}
              />
            )}
          />
          {imageData ? (
            <Image source={{ uri: imageData.path }} style={styles.postImage} />
          ) : post?.mediaUrl ? (
            <Image
              source={{ uri: `${POST_URL}/${post.mediaUrl}` }}
              style={styles.postImage}
            />
          ) : null}
        </PAppContainer>
      </KeyboardAvoidingView>
      <View style={styles.actionWrapper}>
        <IconButton
          icon={<Camera size={32} color={WHITE} />}
          label="Take Photo"
          textStyle={styles.iconText}
          viewStyle={styles.iconButton}
          onPress={takePhoto}
        />
        <IconButton
          icon={<VideoCamera size={32} color={WHITE} />}
          label="Take Video"
          textStyle={styles.iconText}
          viewStyle={styles.iconButton}
          onPress={takeVideo}
        />
        <IconButton
          icon={<GalleryImage size={32} color={WHITE} />}
          label="Gallery"
          textStyle={styles.iconText}
          viewStyle={styles.iconButton}
          onPress={openPicker}
        />
        <IconButton
          icon={<CirclesFour size={32} color={WHITE} />}
          label="Categories"
          textStyle={styles.iconText}
          viewStyle={styles.iconButton}
        />
      </View>
    </View>
  );
};

export default CreatePost;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  usersPart: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentionInput: {
    paddingHorizontal: 8,
    paddingTop: 8,
    lineHeight: 20,
    color: 'white',
    marginVertical: 16,
    fontSize: 16,
    flex: 1,
  },
  mentionContainer: {
    flex: 1,
    flexGrow: 1,
  },
  mentionList: {
    backgroundColor: BGDARK,
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  mentionItem: {
    borderBottomWidth: 1,
    borderBottomColor: DISABLED,
  },
  postImage: {
    width: '100%',
    height: 224,
    marginVertical: 16,
    borderRadius: 16,
  },
  actionWrapper: {
    backgroundColor: GRAY3,
    borderTopColor: WHITE12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 25,
  },
  iconButton: {
    flexDirection: 'column',
  },
  iconText: {
    marginTop: 5,
    marginLeft: 0,
  },
  radioGroupStyle: {
    marginVertical: 30,
  },
  radioCircle: {
    width: 24,
    height: 24,
    fillColor: PRIMARY,
    borderColor: PRIMARY,
    borderWidth: 2,
  },
  radioBodyWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioBodyTextStyle: {
    marginLeft: 10,
  },
  doneBtn: {
    width: '100%',
    height: 45,
    borderRadius: 22,
    borderColor: PRIMARYSOLID,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
