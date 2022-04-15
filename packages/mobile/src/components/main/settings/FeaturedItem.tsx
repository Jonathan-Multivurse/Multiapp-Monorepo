import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import FastImage from 'react-native-fast-image';
import dayjs from 'dayjs';

import PLabel from '../../common/PLabel';
import IconButton from '../../common/IconButton';
import UserInfo from '../../common/UserInfo';
import Tag from '../../common/Tag';
import { BGDARK, GRAY10, PRIMARY, WHITE60 } from 'shared/src/colors';
import { Body1, Body3 } from '../../../theme/fonts';
import { PostDataType } from '../../../graphql/post';

import { FetchPostsData } from 'mobile/src/hooks/queries';
import { PostCategories } from 'backend/graphql/enumerations.graphql';

//import { AVATAR_URL, POST_URL } from '@env';
const AVATAR_URL =
  'https://prometheus-user-media.s3.us-east-1.amazonaws.com/avatars';
const POST_URL =
  'https://prometheus-user-media.s3.us-east-1.amazonaws.com/posts';

type Post = Exclude<FetchPostsData['posts'], undefined>[number];
interface FeedItemProps {
  post: Post;
  type?: string;
}

const FeaturedItem: React.FC<FeedItemProps> = ({ post, type }) => {
  const { user } = post;

  return (
    <View style={[styles.container]}>
      <View style={styles.headerWrapper}>
        <UserInfo
          avatar={{ uri: `${AVATAR_URL}/${user.avatar}` }}
          name={`${user.firstName} ${user.lastName}`}
          role={user.position}
          company={user.company?.name}
          avatarSize={56}
          auxInfo={dayjs(post.createdAt).format('MMM D')}
        />
      </View>
      <PLabel
        label={post.body}
        viewStyle={styles.labelView}
        textStyle={styles.body}
        numberOfLines={2}
      />
      <Image
        style={styles.postImage}
        source={{ uri: `${POST_URL}/${post.mediaUrl}` }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: BGDARK,
    marginBottom: 16,
    width: 300,
    marginRight: 16,
    borderRadius: 6,
    borderColor: PRIMARY,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerWrapper: {
    flexDirection: 'row',
    marginVertical: 16,
    alignItems: 'center',
  },
  postImage: {
    width: '100%',
    height: 170,
    marginTop: 16,
  },
  body: {
    lineHeight: 20,
  },
  labelView: {
    paddingHorizontal: 16,
  },
});

export default FeaturedItem;