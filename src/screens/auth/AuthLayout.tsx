// Shared frame for the signed-out screens: logo, then a card with a heading.
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Logo } from '../../components/Logo';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

type Props = { title: string; subtitle: string; children: React.ReactNode };

export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Logo height={56} />
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export const authStyles = StyleSheet.create({
  error: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  notice: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.brandBone,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.ink, marginBottom: 18 },
  gap: { height: 8 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgApp },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  brand: { alignItems: 'center', marginBottom: 28 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontFamily: fonts.serifSemibold, fontSize: 26, color: colors.inkStrong },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.inkMuted,
    marginTop: 4,
    marginBottom: 22,
  },
});
