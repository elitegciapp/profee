import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { theme } from '@/constants/theme';

type Props = ViewProps;

export function Surface({ style, children, ...rest }: Props) {
  return (
    <View style={[styles.surface, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: theme.colors.bgSecondary,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
