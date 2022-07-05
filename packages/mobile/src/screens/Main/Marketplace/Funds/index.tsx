import React, { useMemo, useState } from 'react';
import {
  ListRenderItem,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Info } from 'phosphor-react-native';

import Disclosure from 'mobile/src/components/main/Disclosure';
import FundItem from 'mobile/src/components/main/funds/FundItem';
import pStyles from 'mobile/src/theme/pStyles';
import { BLACK, WHITE, WHITE12, WHITE60 } from 'shared/src/colors';
import { H6Bold } from 'mobile/src/theme/fonts';

import AccreditationLock from './AccreditationLock';
import FundsPlaceholder from '../../../../components/placeholder/FundsPlaceholder';
import { FundsScreen } from 'mobile/src/navigations/MarketplaceTabs';

import {
  AssetClasses,
  Fund,
  useFunds,
} from 'shared/graphql/query/marketplace/useFunds';

const PLACE_HOLDERS = 7;

const Funds: FundsScreen = () => {
  const focused = useIsFocused();

  const { data, refetch } = useFunds();
  const [focus, setFocus] = useState(focused);
  const [disclosureVisible, setDisclosureVisible] = useState(false);

  if (focused !== focus) {
    console.log('refetching funds');
    refetch();
    setFocus(focused);
  }

  const sectionedFunds = useMemo(() => {
    const sectionedData = AssetClasses.map((assetClass) => ({
      title: assetClass.label,
      data:
        data?.funds?.filter((fund) => fund.class === assetClass.value) ?? [],
    })).filter((section) => section.data.length > 0);

    return sectionedData;
  }, [data?.funds]);

  if (!data?.funds) {
    return (
      <View style={pStyles.globalContainer}>
        {[...Array(PLACE_HOLDERS)].map((_, index) => (
          <FundsPlaceholder key={index} />
        ))}
      </View>
    );
  }

  if (data && data.funds && data.funds.length === 0) {
    return <AccreditationLock />;
  }

  const keyExtractor = (item: Fund): string => item._id;
  const renderItem: ListRenderItem<Fund> = ({ item, index }) => {
    return <FundItem fund={item} index={index} />;
  };

  return (
    <View style={styles.container}>
      <SectionList
        sections={sectionedFunds}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>{title}</Text>
          </View>
        )}
        ListFooterComponent={
          <>
            <Pressable
              onPress={() => setDisclosureVisible(true)}
              style={({ pressed }) => [
                styles.disclosureContainer,
                pressed ? pStyles.pressedStyle : null,
              ]}>
              <Info color={WHITE60} size={20} />
              <Text style={styles.disclosureText}>Prometheus Disclosures</Text>
            </Pressable>
            <Disclosure
              isVisible={disclosureVisible}
              onDismiss={() => setDisclosureVisible(false)}
            />
          </>
        }
      />
    </View>
  );
};

export default Funds;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  listHeader: {
    backgroundColor: BLACK,
    borderColor: WHITE12,
    borderBottomWidth: 1,
  },
  listHeaderText: {
    color: WHITE,
    padding: 16,
    ...H6Bold,
  },
  disclosureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  disclosureText: {
    color: WHITE60,
    marginLeft: 8,
  },
});
