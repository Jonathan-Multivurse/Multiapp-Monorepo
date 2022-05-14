import React, { useState } from 'react';
import { StyleSheet, FlatList, View, Text, ListRenderItem } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import { BLACK, WHITE } from 'shared/src/colors';
import pStyles from 'mobile/src/theme/pStyles';
import { H6 } from 'mobile/src/theme/fonts';

import AccreditationLock from './AccreditationLock';
import FundItem from './FundItem';
import FundsPlaceholder from '../../../../components/placeholder/FundsPlaceholder';
import { FundsScreen } from 'mobile/src/navigations/MarketplaceTabs';

import { useFunds, Fund } from 'shared/graphql/query/marketplace/useFunds';

const PLACE_HOLDERS = 7;

const Funds: FundsScreen = ({ navigation }) => {
  const { data, refetch, loading } = useFunds();

  const isFocused = useIsFocused();
  const [focusState, setFocusState] = useState(isFocused);
  if (isFocused !== focusState) {
    // Refetch whenever the focus state changes to avoid refetching during
    // rerender cycles
    console.log('refetching...');
    refetch();
    setFocusState(isFocused);
  }

  if (!data?.funds && loading) {
    return (
      <View style={pStyles.globalContainer}>
        {[...Array(PLACE_HOLDERS)].map(() => (
          <FundsPlaceholder />
        ))}
      </View>
    );
  }

  if (data && data.funds && data.funds.length === 0) {
    return <AccreditationLock />;
  }

  const keyExtractor = (item: Fund): string => item._id;
  const renderItem: ListRenderItem<Fund> = ({ item }) => {
    return (
      <FundItem
        fund={item}
        onClickFundDetails={() =>
          navigation.navigate('FundDetails', { fundId: item._id })
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.funds ?? []}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          // TODO Private Equity Start
          <View>
            {data?.funds && data?.funds.length > 0 && (
              <>
                <Text style={[styles.listHeaderText, H6]}>Private Equity</Text>
                <FundItem
                  fund={data.funds[0]}
                  category="equity"
                  onClickFundDetails={() => {
                    data.funds?.[0]?._id &&
                      navigation.navigate('FundDetails', {
                        fundId: data.funds[0]._id,
                      });
                  }}
                />
              </>
            )}
            {/* TODO Private Equity End */}
            <Text style={[styles.listHeaderText, H6]}>Hedge Funds</Text>
          </View>
        }
        listKey="hedge_funds"
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
  listHeaderText: {
    color: WHITE,
    padding: 16,
    fontWeight: 'bold',
  },
});
