import React, { FC, useState } from 'react';
import { StyleSheet, FlatList, View, Text, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '@react-navigation/native';
import { CaretLeft, MagnifyingGlass } from 'phosphor-react-native';
import { WHITE, BGDARK } from 'shared/src/colors';

import PHeader from '../../../components/common/PHeader';
import pStyles from '../../../theme/pStyles';
import { Body1, Body2, Body3 } from '../../../theme/fonts';
import MainHeader from '../../../components/main/Header';

interface RouterProps {
  navigation: NavigationProp<any, any>;
}
const Terms: FC<RouterProps> = ({ navigation }) => {
  return (
    <View style={pStyles.globalContainer}>
      <MainHeader
        leftIcon={
          <View style={styles.row}>
            <CaretLeft size={28} color={WHITE} />
            <Text style={styles.headerTitle} numberOfLines={1}>
              Terms and Disclosures
            </Text>
          </View>
        }
        onPressLeft={navigation.goBack}
      />
    </View>
  );
};

export default Terms;

const styles = StyleSheet.create({
  headerTitle: {
    ...Body1,
    color: WHITE,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
