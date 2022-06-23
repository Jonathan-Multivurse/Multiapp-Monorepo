import React, { FC, useState, useEffect, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ListRenderItem,
  StyleSheet,
  FlatList,
  View,
  Text,
  Pressable,
} from 'react-native';
import { CaretLeft } from 'phosphor-react-native';
import { CommonActions } from '@react-navigation/native';

import PHeader from 'mobile/src/components/common/PHeader';
import SearchInput from 'mobile/src/components/common/SearchInput';
import { Body1Bold, Body3Bold } from 'mobile/src/theme/fonts';
import PAppContainer from 'mobile/src/components/common/PAppContainer';
import pStyles from 'mobile/src/theme/pStyles';
import {
  PRIMARY,
  WHITE,
  WHITE12,
  GRAY700,
  GRAY600,
  GRAY900,
} from 'shared/src/colors';

import { useForm, Controller, DefaultValues } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { useChatContext } from 'mobile/src/context/Chat';
import {
  findUsers,
  createChannel,
  Channel,
  ChannelSort,
  ChannelFilters,
  User,
} from 'mobile/src/services/chat';
import UserItem from 'mobile/src/components/main/chat/UserItem';

import { NewChatScreen } from 'mobile/src/navigations/ChatStack';

type FormValues = {
  search?: string;
};

const schema = yup
  .object({
    search: yup.string().notRequired().default(''),
  })
  .required();

const NewChat: NewChatScreen = ({ navigation }) => {
  const { client, userId } = useChatContext() || {};
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const { control, handleSubmit, getValues } = useForm<
    yup.InferType<typeof schema>
  >({
    resolver: yupResolver(schema),
    mode: 'onSubmit',
    defaultValues: schema.cast(
      {},
      { assert: false },
    ) as DefaultValues<FormValues>,
  });

  const performSearch = useCallback(async () => {
    if (!client) {
      return;
    }

    const searchText = getValues('search') ?? '';
    const searchResults = await findUsers(client, searchText, [
      { last_active: -1 },
      { id: 1 },
    ]);

    if (searchResults) {
      setUsers(searchResults);
    }
  }, [client, getValues]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  if (!client || !userId) {
    // Return error state
    return <PAppContainer noScroll />;
  }

  const onSubmit = async (): Promise<void> => {
    if (!client || selectedUsers.length === 0) {
      return;
    }

    const members = [userId, ...selectedUsers.map((user) => user.id)];
    const channel = await createChannel(client, members);

    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          { name: 'ChannelList' },
          { name: 'Channel', params: { channelId: channel.cid, channel } },
        ],
      }),
    );
  };

  const onSelected = (user: User): void => {
    setSelectedUsers([...selectedUsers, user]);
  };

  const onRemove = (user: User): void => {
    setSelectedUsers([
      ...selectedUsers.filter((selectedUser) => selectedUser.id !== user.id),
    ]);
  };

  const renderItem: ListRenderItem<User> = ({ item }) => (
    <UserItem user={item} onPress={onSelected} />
  );

  const disableNext = selectedUsers.length === 0;
  return (
    <View style={pStyles.globalContainer}>
      <PHeader
        leftIcon={
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => (pressed ? pStyles.pressedStyle : null)}>
            <CaretLeft size={32} color={WHITE} />
          </Pressable>
        }
        centerIcon={
          <View style={styles.headerTitleContainer} pointerEvents="none">
            <Text style={styles.headerTitle}>Send a Message</Text>
          </View>
        }
        rightIcon={
          <Pressable disabled={disableNext} onPress={handleSubmit(onSubmit)}>
            <Text style={[styles.next, disableNext ? styles.disabled : null]}>
              Next
            </Text>
          </Pressable>
        }
        outerContainerStyle={styles.header}
      />
      <Controller
        name="search"
        control={control}
        render={({ field }) => (
          <SearchInput
            {...field}
            onChangeText={(text) => {
              field.onChange(text);
              performSearch();
            }}
            onClear={() => {
              field.onChange('');
              performSearch();
            }}
            containerStyle={styles.textContainerStyle}
            style={styles.textStyle}
            placeholder="Search members"
            placeholderTextColor={GRAY600}
          />
        )}
      />
      {selectedUsers.length > 0 ? (
        <View style={styles.sendingToContainer}>
          <Text style={styles.sendingTo}>Sending to:</Text>
          {selectedUsers.map((user) => (
            <UserItem key={user.id} user={user} onRemove={onRemove} />
          ))}
          <View style={styles.separator} />
        </View>
      ) : null}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          data={users.filter(
            (user) =>
              !selectedUsers.some(
                (selectedUser) => selectedUser.id === user.id,
              ),
          )}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.id}`}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

export default NewChat;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    borderColor: WHITE12,
    borderBottomWidth: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Body1Bold,
    color: WHITE,
    textAlign: 'center',
  },
  next: {
    color: PRIMARY,
    ...Body1Bold,
  },
  disabled: {
    color: GRAY600,
  },
  textContainerStyle: {
    marginVertical: 16,
  },
  textStyle: {
    backgroundColor: GRAY700,
    borderRadius: 16,
    height: 40,
    borderWidth: 0,
    color: WHITE,
  },
  sendingToContainer: {
    marginTop: 16,
  },
  sendingTo: {
    paddingLeft: 16,
    color: WHITE,
    ...Body3Bold,
  },
  separator: {
    height: 24,
    backgroundColor: GRAY900,
  },
});
