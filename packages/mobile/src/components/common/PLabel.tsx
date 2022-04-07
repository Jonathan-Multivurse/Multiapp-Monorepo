import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Body2 } from '../../theme/fonts';
import { WHITE } from 'shared/src/colors';

interface PLabelProps {
  viewStyle?: object;
  textStyle?: object;
  label: string;
}

const PLabel: React.FC<PLabelProps> = (props) => {
  const { viewStyle, textStyle, label } = props;

  return (
    <View style={[styles.container, viewStyle]}>
      <Text style={[styles.textStyle, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  textStyle: {
    color: WHITE,
    ...Body2,
  },
});

export default PLabel;
