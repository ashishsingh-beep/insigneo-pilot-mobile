// ---------------------------------------------------------------------------
// Keeps inputs above the keyboard on both platforms.
// ---------------------------------------------------------------------------
// React Native 0.87 draws Android apps edge-to-edge, and in that mode Android
// no longer resizes the window for the keyboard (windowSoftInputMode
// adjustResize has no effect). So the content is padded up by the keyboard's
// height on Android as well as iOS.
//
// KeyboardAvoidingView measures its own position relative to its parent,
// while the keyboard is reported in screen coordinates — on a screen under a
// navigation header the header height is the difference, so it is passed as
// the offset (0 on screens without a header).
// ---------------------------------------------------------------------------

import React from 'react';
import { KeyboardAvoidingView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

type Props = { children: React.ReactNode; style?: StyleProp<ViewStyle> };

export function KeyboardAvoider({ children, style }: Props) {
  const headerHeight = useHeaderHeight();
  return (
    <KeyboardAvoidingView style={[styles.flex, style]} behavior="padding" keyboardVerticalOffset={headerHeight}>
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
