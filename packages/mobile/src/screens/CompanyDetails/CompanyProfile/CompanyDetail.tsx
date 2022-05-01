import React, { FC, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  Linking,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Modal from 'react-native-modal';
import { Chats, CopySimple, Pencil, Share } from 'phosphor-react-native';
import { AVATAR_URL, BACKGROUND_URL } from 'react-native-dotenv';

import Avatar from 'mobile/src/components/common/Avatar';
import PGradientButton from 'mobile/src/components/common/PGradientButton';
import PGradientOutlineButton from 'mobile/src/components/common/PGradientOutlineButton';
import LinkedinSvg from 'shared/assets/images/linkedin.svg';
import TwitterSvg from 'shared/assets/images/twitter.svg';
import DotsThreeVerticalSvg from 'shared/assets/images/dotsThreeVertical.svg';
import FollowModal from './FollowModal';
import { Body2, Body3, H5Bold, H6Bold } from 'mobile/src/theme/fonts';
import {
  WHITE,
  WHITE12,
  BLUE300,
  WHITE87,
  GRAY100,
  PRIMARY,
  BGDARK,
  PRIMARYSOLID,
} from 'shared/src/colors';

import { useAccount } from 'mobile/src/graphql/query/account';
import { useFollowCompany } from 'mobile/src/graphql/mutation/account';
import type { CompanyProfile } from 'mobile/src/graphql/query/company/useCompany';
import * as NavigationService from 'mobile/src/services/navigation/NavigationService';

interface CompanyDetailProps {
  company: CompanyProfile;
  isMyCompany?: boolean;
}

const CompanyDetail: FC<CompanyDetailProps> = ({ company, isMyCompany }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleFollow, setVisibleFollow] = useState(false);
  const { data: accountData, refetch } = useAccount();
  const [followCompany] = useFollowCompany();
  const userId = accountData?.account._id;

  const {
    _id,
    name,
    avatar,
    background,
    postIds,
    followerIds,
    followingIds,
    website,
    linkedIn,
    twitter,
  } = company;

  const isFollower = useMemo(() => {
    if (followerIds && userId) {
      return followerIds.indexOf(userId) > -1 ? true : false;
    }
    return false;
  }, [followerIds]);

  const toggleFollowCompany = async (id: string): Promise<void> => {
    try {
      const follow = isFollower ? false : true;
      const { data } = await followCompany({
        variables: { follow: follow, companyId: id },
      });
      if (data?.followCompany) {
        refetch();
      } else {
        console.log('err', data);
      }
    } catch (err) {
      console.log('err', err);
    }
  };

  return (
    <>
      <View style={styles.relative}>
        {background?.url ? (
          <FastImage
            style={styles.backgroundImg}
            source={{
              uri: `${BACKGROUND_URL}/${background.url}`,
            }}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <PGradientButton
            btnContainer={styles.noBackground}
            gradientContainer={styles.gradientContainer}
          />
        )}
        {isMyCompany && (
          <TouchableOpacity
            onPress={() =>
              NavigationService.navigate('EditCompanyPhoto', {
                companyId: company._id,
                type: 'BACKGROUND',
              })
            }
            style={styles.pencil}>
            <Pencil color={WHITE} size={18} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.companyDetail}>
          <View style={styles.relative}>
            {avatar ? (
              <Avatar user={{ avatar }} style={styles.avatar} size={80} />
            ) : (
              <View style={styles.noAvatarContainer}>
                <Text style={styles.noAvatar}>{name.charAt(0)}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() =>
                NavigationService.navigate('EditCompanyPhoto', {
                  companyId: company._id,
                  type: 'AVATAR',
                })
              }
              style={styles.pencil}>
              <Pencil color={WHITE} size={18} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.val}>{name}</Text>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() =>
              followerIds && followerIds.length > 0 && setVisibleFollow(true)
            }>
            <View style={styles.follow}>
              <Text style={styles.val}>{followerIds?.length ?? 0}</Text>
              <Text style={styles.comment}>Followers</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              followingIds && followingIds.length > 0 && setVisibleFollow(true)
            }>
            <View style={styles.follow}>
              <Text style={styles.val}>{followingIds?.length ?? 0}</Text>
              <Text style={styles.comment}>Following</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.follow}>
            <Text style={styles.val}>{postIds?.length ?? 0}</Text>
            <Text style={styles.comment}>Posts</Text>
          </View>
        </View>
        <Text style={styles.decription}>{company.overview}</Text>
        {isMyCompany ? (
          <PGradientOutlineButton
            label="Edit Profile"
            onPress={() =>
              NavigationService.navigate('EditCompanyProfile', {
                companyId: company._id,
              })
            }
            gradientContainer={styles.editButton}
          />
        ) : (
          <View style={styles.row}>
            <PGradientOutlineButton
              label="Message"
              onPress={() => console.log(11)}
              gradientContainer={styles.button}
            />
            <PGradientButton
              label={isFollower ? 'unfollow' : 'follow'}
              onPress={() => toggleFollowCompany(company._id)}
              gradientContainer={styles.button}
            />
          </View>
        )}
      </View>
      <View style={[styles.row, styles.social]}>
        <View style={styles.socialView}>
          {linkedIn && linkedIn !== '' && (
            <TouchableOpacity onPress={() => Linking.openURL(linkedIn)}>
              <LinkedinSvg />
            </TouchableOpacity>
          )}
          {twitter && twitter !== '' && (
            <TouchableOpacity
              onPress={() => Linking.openURL(twitter)}
              style={styles.socialItem}>
              <TwitterSvg />
            </TouchableOpacity>
          )}
          {website && website !== '' && (
            <>
              <View style={styles.verticalLine} />
              <TouchableOpacity onPress={() => Linking.openURL(website)}>
                <Text style={styles.website} numberOfLines={1}>
                  {website}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <TouchableOpacity onPress={() => setIsVisible(true)}>
          <DotsThreeVerticalSvg />
        </TouchableOpacity>
      </View>
      <Modal
        isVisible={isVisible}
        swipeDirection="down"
        onBackdropPress={() => setIsVisible(false)}
        style={styles.bottomHalfModal}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={() => setIsVisible(false)}>
            <View style={styles.item}>
              <Chats color={WHITE} size={28} />
              <View style={styles.commentWrap}>
                <Text style={styles.modalLabel}>Message {company.name}</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsVisible(false)}>
            <View style={styles.item}>
              <Share color={WHITE} size={28} />
              <View style={styles.commentWrap}>
                <Text style={styles.modalLabel}>Share as Post</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsVisible(false)}>
            <View style={styles.item}>
              <CopySimple color={WHITE} size={28} />
              <View style={styles.commentWrap}>
                <Text style={styles.modalLabel}>Copy Link</Text>
              </View>
            </View>
          </TouchableOpacity>

          <PGradientOutlineButton
            label="Cancel"
            onPress={() => setIsVisible(false)}
          />
        </View>
      </Modal>
      <FollowModal
        onClose={() => setVisibleFollow(false)}
        following={accountData?.account.following ?? []}
        followers={accountData?.account.followers ?? []}
        isVisible={visibleFollow}
      />
    </>
  );
};

export default CompanyDetail;

const styles = StyleSheet.create({
  backIcon: {
    backgroundColor: BLUE300,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 0,
  },
  backgroundImg: {
    width: Dimensions.get('screen').width,
    height: 65,
  },
  logo: {
    width: 80,
    height: 80,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    flex: 1,
    marginTop: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  follow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyDetail: {
    flexDirection: 'row',
    marginTop: -40,
    marginBottom: 16,
  },
  val: {
    color: WHITE,
    ...H6Bold,
  },
  comment: {
    color: WHITE,
    ...Body3,
    marginLeft: 8,
  },
  decription: {
    marginVertical: 16,
    color: WHITE,
    ...Body3,
  },
  social: {
    paddingVertical: 8,
    paddingLeft: 16,
    borderTopColor: WHITE12,
    borderBottomColor: WHITE12,
    borderBottomWidth: 1,
    borderTopWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verticalLine: {
    height: 32,
    backgroundColor: GRAY100,
    width: 1,
    marginLeft: 40,
    marginRight: 20,
  },
  website: {
    color: PRIMARY,
    ...Body3,
  },
  button: {
    width: Dimensions.get('screen').width / 2 - 24,
  },
  socialView: {
    flexDirection: 'row',
  },
  socialItem: {
    marginHorizontal: 16,
  },
  bottomHalfModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: BGDARK,
    padding: 20,
    borderRadius: 32,
  },
  commentWrap: {
    marginLeft: 15,
    flex: 1,
  },
  modalLabel: {
    color: WHITE,
    ...Body2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  relative: {
    position: 'relative',
  },
  noAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAvatar: {
    color: PRIMARYSOLID,
    ...H5Bold,
    textAlign: 'center',
  },
  noBackground: {
    height: 65,
  },
  gradientContainer: {
    borderRadius: 0,
    height: 65,
  },
  pencil: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: PRIMARYSOLID,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    borderRadius: 8,
  },
  editButton: {
    width: Dimensions.get('screen').width - 32,
  },
});