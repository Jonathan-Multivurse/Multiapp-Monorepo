import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import FastImage from 'react-native-fast-image';
import dayjs from 'dayjs';
import { AVATAR_URL, POST_URL } from 'react-native-dotenv';

import PLabel from '../../common/PLabel';
import Media from '../../common/Media';
import UserInfo from '../../common/UserInfo';
import Tag from '../../common/Tag';
import { PRIMARY } from 'shared/src/colors';

import { Post } from 'mobile/src/graphql/query/post/usePosts';

interface FeedItemProps {
  post: Post;
  type?: string;
}

const FeaturedItem: React.FC<FeedItemProps> = ({ post, type }) => {
  const { user, body, mediaUrl } = post;

  return (
    <View style={[styles.container]}>
      <View style={styles.headerWrapper}>
        <UserInfo
          user={user}
          avatarSize={56}
          auxInfo={dayjs(post.createdAt).format('MMM D')}
        />
      </View>
      {body ? (
        <PLabel
          label={body}
          viewStyle={styles.labelView}
          textStyle={styles.body}
          numberOfLines={2}
        />
      ) : null}
      {mediaUrl ? <Media style={styles.postImage} src={mediaUrl} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
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
    alignItems: 'center',
    paddingHorizontal: 16,
    flex: 1,
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
