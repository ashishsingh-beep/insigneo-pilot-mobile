// "Thinking…" row shown until the first text arrives. The label only appears
// when the backend reports a real work state — the app never invents one.
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

export const STATUS_LABELS: Record<string, string> = {
  thinking: 'Thinking',
  searching: 'Searching the web',
  reading: 'Reading your files',
  using_files: 'Reading your files',
  generating: 'Writing response',
  generating_file: 'Generating your file',
  m365: 'Searching your Microsoft 365',
};

function Dot({ delay }: { delay: number }) {
  const value = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        Animated.delay(600 - delay),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, value]);
  return <Animated.View style={[styles.dot, { opacity: value }]} />;
}

export function TypingIndicator({ status }: { status: string | null }) {
  const label = status ? STATUS_LABELS[status] : null;
  return (
    <View style={styles.row} accessibilityLabel={label || 'Waiting for reply'}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.dots}>
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkMuted },
  dots: { flexDirection: 'row', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.brandBlue600 },
});
