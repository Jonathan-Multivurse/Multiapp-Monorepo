import React, { FC, useState } from 'react';
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp } from '@react-navigation/native';
import Modal from 'react-native-modal';
import { CaretRight, CaretLeft, MagnifyingGlass } from 'phosphor-react-native';
import {
  BGDARK,
  GRAY2,
  GRAY100,
  WHITE,
  BGDARK100,
  PRIMARYSOLID7,
  DANGER,
} from 'shared/src/colors';

import pStyles from '../../../theme/pStyles';
import { Body1, Body2, Body3, H5 } from '../../../theme/fonts';
import PHeader from '../../../components/common/PHeader';
import MainHeader from '../../../components/main/Header';

interface RenderItemProps {
  item: {
    id: string;
    label: string;
    onPress: () => void;
  };
}

interface RouterProps {
  navigation: NavigationProp<any, any>;
}

const AccountAdmin: FC<RouterProps> = ({ navigation }) => {
  const DATA = [
    {
      id: '11',
      label: 'Edit your profile',
      onPress: () => console.log(123),
    },
    {
      id: '21',
      label: 'Change your password',
      onPress: () => navigation.navigate('ChangePass'),
    },
    {
      id: 'delete',
      label: 'Delete Account',
      onPress: () => setIsVisible(true),
    },
  ];

  const [isVisible, setIsVisible] = useState(false);

  const renderListItem = ({ item }: RenderItemProps) => {
    return (
      <TouchableOpacity onPress={item.onPress}>
        <View style={[styles.item, styles.between]}>
          <Text style={[styles.label, item.id === 'delete' && styles.delete]}>
            {item.label}
          </Text>
          <CaretRight size={28} color={WHITE} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={pStyles.globalContainer}>
      <MainHeader
        leftIcon={
          <View style={styles.row}>
            <CaretLeft size={28} color={WHITE} />
            <Text style={styles.headerTitle}>Account Admin</Text>
          </View>
        }
        onPressLeft={() => navigation.goBack()}
      />
      <FlatList
        data={DATA}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id}
        style={styles.flatList}
      />
      <Modal
        isVisible={isVisible}
        swipeDirection="down"
        onBackdropPress={() => setIsVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Are you sure you want to delete account?
          </Text>
          <View style={[styles.row, styles.between]}>
            <TouchableOpacity onPress={() => setIsVisible(false)}>
              <Text style={styles.btnTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsVisible(false)}>
              <Text style={[styles.btnTxt, styles.danger]}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AccountAdmin;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    ...Body1,
    color: WHITE,
  },
  flatList: {
    flex: 1,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: PRIMARYSOLID7,
    marginTop: 16,
  },
  label: {
    ...Body2,
    color: WHITE,
  },
  between: {
    justifyContent: 'space-between',
  },
  delete: {
    color: DANGER,
  },
  modalContent: {
    backgroundColor: BGDARK100,
    padding: 20,
  },
  modalTitle: {
    textAlign: 'center',
    ...H5,
    color: WHITE,
  },
  btnTxt: {
    padding: 20,
    color: WHITE,
    ...Body1,
  },
  danger: {
    color: DANGER,
  },
});