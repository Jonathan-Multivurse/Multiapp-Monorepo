import React, { FC, useState } from 'react';
import {
  TouchableOpacity,
  Image,
  Text,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import Avatar from 'mobile/src/components/common/Avatar';
import Tag from 'mobile/src/components/common/Tag';
import * as NavigationService from 'mobile/src/services/navigation/NavigationService';
import {
  PRIMARY,
  WHITE,
  SUCCESS,
  DANGER,
  GRAY100,
  WHITE12,
} from 'shared/src/colors';
import { Body1, Body2, Body3 } from 'mobile/src/theme/fonts';

import { AVATAR_URL, BACKGROUND_URL } from 'react-native-dotenv';
import {
  FundSummary,
  FundManager,
  FundCompany,
} from 'mobile/src/graphql/fragments/fund';

import { useAccount } from 'mobile/src/graphql/query/account';
import { useFollowUser } from 'mobile/src/graphql/mutation/account';

export type Fund = FundSummary & FundManager & FundCompany;
export interface FundProfileInfo {
  fund: Fund;
  showOverview?: boolean;
  showTags?: boolean;
}

const FundProfileInfo: FC<FundProfileInfo> = ({
  fund,
  showOverview,
  showTags,
}) => {
  const { data: accountData } = useAccount();
  const [followUser] = useFollowUser();

  const isFollowingManager = !!accountData?.account?.followingIds?.includes(
    fund.manager._id,
  );
  const [following, setFollowing] = useState(isFollowingManager);
  const toggleFollow = async (): Promise<void> => {
    if (!accountData) return;

    // Update state immediately for responsiveness
    setFollowing(!isFollowingManager);

    const result = await followUser({
      variables: {
        userId: fund.manager._id,
        follow: !following,
      },
      refetchQueries: ['Account'],
    });

    if (!result.data?.followUser) {
      // Revert back to original state on error
      setFollowing(isFollowingManager);
    }
  };

  const goToManager = () =>
    NavigationService.navigate('UserDetails', {
      screen: 'UserProfile',
      params: {
        userId: fund.manager._id,
      },
    });

  const { background, avatar } = fund.company;
  return (
    <View>
      <View style={styles.imagesContainer}>
        {background && (
          <FastImage
            style={styles.backgroundImage}
            source={{ uri: `${BACKGROUND_URL}/${background.url}` }}
            resizeMode={FastImage.resizeMode.cover}
          />
        )}
        {avatar && (
          <Avatar user={{ avatar }} size={64} style={styles.avatarImage} />
        )}
      </View>
      <View style={styles.fundDetailsContainer}>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              fund.status === 'OPEN' ? styles.open : styles.closed,
            ]}
          />
          <Text
            style={[
              styles.whiteText,
              fund.status === 'OPEN' ? styles.successText : styles.dangerText,
            ]}>
            {fund.status}
          </Text>
        </View>
        <Text style={[styles.whiteText, Body1, styles.fund]}>{fund.name}</Text>
        <Text style={[styles.company, Body2]}>{fund.company.name}</Text>
        {showOverview && (
          <Text style={[styles.overview, styles.whiteText, Body2]}>
            {fund.overview}
          </Text>
        )}
        {showTags && (
          <View style={styles.tags}>
            {fund.tags.map((tag, index) => (
              <Tag label={tag} viewStyle={styles.tagStyle} key={index} />
            ))}
          </View>
        )}
        {fund && fund.manager && (
          <Pressable onPress={goToManager}>
            <View style={styles.managerContainer}>
              <Avatar
                size={48}
                user={fund.manager}
                style={styles.managerAvatar}
              />
              <View>
                <View style={styles.manager}>
                  <Text style={[styles.whiteText, Body2]}>
                    {`${fund.manager.firstName} ${fund.manager.lastName}`}
                  </Text>
                  <View style={styles.separator} />
                  <TouchableOpacity onPress={toggleFollow}>
                    <Text style={[styles.follow, Body3]}>
                      {following ? 'Unfollow' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.managerInfo}>
                  <Text style={[styles.grayText, Body2]}>
                    {`${fund.manager.followerIds?.length ?? 0} Followers`}
                  </Text>
                  <View style={styles.separator} />
                  <Text style={[styles.grayText, Body2]}>
                    {`${fund.manager.postIds?.length ?? 0} Posts`}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
      </View>
      <View style={styles.fundSummaryContainer}>
        <View style={[styles.fundDescriptorContainer, styles.rightSeparator]}>
          <Text style={[styles.title, styles.center]}>Asset Class</Text>
          <Text style={[styles.whiteText, styles.center]}>Hedge Fund</Text>
        </View>
        <View style={[styles.fundDescriptorContainer, styles.rightSeparator]}>
          <Text style={[styles.title, styles.center]}>Strategy</Text>
          <Text style={[styles.whiteText, styles.center]}>Multi-Strategy</Text>
        </View>
        <View style={styles.fundDescriptorContainer}>
          <Text style={[styles.title, styles.center]}>Minimum</Text>
          <Text style={[styles.whiteText, styles.center]}>$500K</Text>
        </View>
      </View>
    </View>
  );
};

export default FundProfileInfo;

const styles = StyleSheet.create({
  fundItem: {
    marginBottom: 16,
  },
  imagesContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'visible',
    zIndex: 2,
  },
  backgroundImage: {
    width: '100%',
    height: 80,
  },
  avatarImage: {
    aspectRatio: 1,
    borderRadius: 4,
    position: 'absolute',
    left: 16,
    bottom: -32,
  },
  fundDetailsContainer: {
    padding: 16,
    borderColor: WHITE12,
    borderBottomWidth: 1,
    zIndex: 1,
  },
  whiteText: {
    color: WHITE,
  },
  grayText: {
    color: GRAY100,
  },
  successText: {
    color: SUCCESS,
  },
  dangerText: {
    color: DANGER,
  },
  fund: {
    marginTop: 16,
    lineHeight: 24,
  },
  company: {
    color: PRIMARY,
    marginBottom: 16,
  },
  overview: {
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -8,
    marginRight: 16,
  },
  statusIndicator: {
    width: 12,
    aspectRatio: 1,
    borderRadius: 6,
    marginRight: 4,
  },
  open: {
    backgroundColor: SUCCESS,
  },
  closed: {
    backgroundColor: DANGER,
  },
  fundSummaryContainer: {
    flexDirection: 'row',
  },
  fundDescriptorContainer: {
    flex: 1,
    padding: 16,
    borderBottomColor: WHITE12,
    borderBottomWidth: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  tagStyle: {
    marginRight: 8,
  },
  managerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopColor: WHITE12,
    borderTopWidth: 1,
  },
  manager: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  managerAvatar: {
    marginRight: 12,
  },
  managerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GRAY100,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 24,
  },
  follow: {
    textTransform: 'uppercase',
    color: PRIMARY,
  },
  center: {
    textAlign: 'center',
    marginTop: 4,
  },
  rightSeparator: {
    borderRightColor: WHITE12,
    borderRightWidth: 1,
  },
  title: {
    textTransform: 'uppercase',
    color: GRAY100,
    fontSize: 10,
    letterSpacing: 2,
  },
  actionBar: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    flex: 1,
  },
  button: {
    fontWeight: 'bold',
    textTransform: 'none',
  },
  favorite: {
    marginLeft: 16,
  },
});