import React from 'react';
import { StyleSheet, FlatList, View, Text, Switch } from 'react-native';
import { NavigationProp } from '@react-navigation/native';
import { CaretLeft, MagnifyingGlass } from 'phosphor-react-native';

import { WHITE, BGDARK } from 'shared/src/colors';
import pStyles from '../../../theme/pStyles';
import { Body1, Body2, Body3 } from '../../../theme/fonts';

import { CompaniesScreen } from 'mobile/src/navigations/SearchTabs';

const Companies: CompaniesScreen = ({ navigation }) => {
  return <View style={pStyles.globalContainer}></View>;
};

export default Companies;

const styles = StyleSheet.create({});