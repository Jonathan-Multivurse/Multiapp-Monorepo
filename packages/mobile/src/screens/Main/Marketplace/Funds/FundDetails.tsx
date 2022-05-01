import React, { useState } from 'react';

import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
  CaretLeft,
  DotsThreeOutlineVertical,
  Star,
} from 'phosphor-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PHeader from 'mobile/src/components/common/PHeader';

import pStyles from 'mobile/src/theme/pStyles';
import { Body2 } from 'mobile/src/theme/fonts';
import {
  BLACK,
  PRIMARYSTATE,
  WHITE,
  WHITE12,
  WHITE60,
} from 'shared/src/colors';

import * as NavigationService from 'mobile/src/services/navigation/NavigationService';
import FundProfileInfo from './FundProfileInfo';
import FundOverview from './FundOverview';

import { useFund } from 'mobile/src/graphql/query/marketplace/useFund';
import { useAccount } from 'mobile/src/graphql/query/account';
import { useWatchFund } from 'mobile/src/graphql/mutation/funds';

import { FundDetailsScreen } from 'mobile/src/navigations/AppNavigator';

const Tab = createMaterialTopTabNavigator();
const FundDetails: FundDetailsScreen = ({ route, navigation }) => {
  const { fundId } = route.params;
  const { data } = useFund(fundId);
  const { data: accountData } = useAccount();
  const [watchFund] = useWatchFund();

  const fund = data?.fund;
  const isWatched = !!accountData?.account?.watchlistIds?.includes(fundId);
  const [watching, setWatching] = useState(isWatched);

  const toggleWatchlist = async (): Promise<void> => {
    if (!accountData) return;

    // Update state immediately for responsiveness
    setWatching(!isWatched);

    const result = await watchFund({
      variables: {
        fundId: fundId,
        watch: !isWatched,
      },
      refetchQueries: ['Account'],
    });

    if (!result.data?.watchFund) {
      // Revert back to original state on error
      setWatching(isWatched);
    }
  };

  if (!fund) {
    return (
      <SafeAreaView style={pStyles.globalContainer}>
        <PHeader
          leftIcon={<CaretLeft size={32} color={WHITE} />}
          leftStyle={styles.sideStyle}
          onPressLeft={() => NavigationService.goBack()}
          containerStyle={styles.headerContainer}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={pStyles.globalContainer}>
      <PHeader
        leftIcon={<CaretLeft size={32} color={WHITE} />}
        leftStyle={styles.sideStyle}
        onPressLeft={() => NavigationService.goBack()}
        containerStyle={styles.headerContainer}
      />
      <ScrollView>
        <FundProfileInfo fund={fund} />
        <View style={styles.actionBar}>
          <Pressable
            onPress={toggleWatchlist}
            style={({ pressed }) => [pressed ? styles.onPress : undefined]}>
            <Star
              size={24}
              color={watching ? PRIMARYSTATE : WHITE}
              style={styles.favorite}
              weight={watching ? 'fill' : 'regular'}
            />
          </Pressable>
          <DotsThreeOutlineVertical size={24} color={WHITE} />
        </View>
        {/* TODO: use ohter lib for tab bar like react-native-tab-view */}
        <View style={{ height: 1400 }}>
          <Tab.Navigator
            sceneContainerStyle={styles.tabContainer}
            screenOptions={({ route }) => ({
              swipeEnabled: false, // disabled swipe to scroll team members properly
              tabBarStyle: styles.tabBar,
              tabBarIndicatorStyle: styles.tabBarIndicator,
              tabBarActiveTintColor: WHITE,
              tabBarInactiveTintColor: WHITE60,
              tabBarLabel: ({ focused, color }) => (
                <Text
                  style={[
                    styles.tabBarLabel,
                    Body2,
                    { color },
                    focused ? styles.bold : {},
                  ]}>
                  {route.name}
                </Text>
              ),
            })}
            initialRouteName="FundOverview">
            <Tab.Screen
              name="Overview"
              component={() => <FundOverview fund={fund} />}
            />
            <Tab.Screen name="Documents" component={() => <></>} />
          </Tab.Navigator>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FundDetails;

const styles = StyleSheet.create({
  actionBar: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: WHITE12,
    borderBottomWidth: 1,
  },
  headerContainer: {
    backgroundColor: BLACK,
    marginBottom: 0,
    height: 62,
  },
  sideStyle: {
    top: 16,
  },
  favorite: {},
  tabContainer: {
    backgroundColor: BLACK,
  },
  tabBar: {
    backgroundColor: BLACK,
    marginTop: 0,
    paddingTop: 0,
  },
  tabBarIndicator: {
    backgroundColor: PRIMARYSTATE,
  },
  tabBarLabel: {
    letterSpacing: 1.25,
  },
  bold: {
    fontWeight: 'bold',
  },
  onPress: {
    opacity: 0.5,
  },
});
