// New-chat screen: greeting and the suggestion cards from the web app.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { ChartIcon, DocumentIcon } from '../Icons';

export const SUGGESTIONS = [
  { id: 'analyze', label: 'ANALYZE', icon: 'document', text: 'Summarize the latest fed minutes and highlight inflation concerns.' },
  { id: 'compare', label: 'COMPARE', icon: 'chart', text: 'Compare Q3 earnings performance of top 5 tech equities.' },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export function EmptyState({ firstName, onSuggestion }: { firstName: string; onSuggestion: (text: string) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.greeting}>
        {greeting()}, {firstName}
      </Text>
      <Text style={styles.sub}>How can I assist you with your research today?</Text>
      <View style={styles.cards}>
        {SUGGESTIONS.map((s) => {
          const Icon = s.icon === 'chart' ? ChartIcon : DocumentIcon;
          return (
            <Pressable
              key={s.id}
              onPress={() => onSuggestion(s.text)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardHead}>
                <Icon size={17} color={colors.brandBlue600} />
                <Text style={styles.cardLabel}>{s.label}</Text>
              </View>
              <Text style={styles.cardText}>{s.text}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 },
  greeting: { fontFamily: fonts.serifSemibold, fontSize: 32, lineHeight: 38, color: colors.inkStrong, textAlign: 'center' },
  sub: { fontFamily: fonts.regular, fontSize: 16, color: colors.inkMuted, textAlign: 'center', marginTop: 8 },
  cards: { gap: 10, marginTop: 28 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  pressed: { backgroundColor: colors.hoverBg },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1, color: colors.brandBlue600 },
  cardText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.ink },
});
