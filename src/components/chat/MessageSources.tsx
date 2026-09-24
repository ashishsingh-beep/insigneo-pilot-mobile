// Sources drawn from the project's documents, listed under the answer they
// support (same approach as the web app: a list below the message rather than
// markers inside it, because the spans index into raw markdown).
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import type { Citation } from '../../types/api';
import { plainText } from '../../utils/markdown';
import { ChevronDownIcon, ChevronRightIcon, DocumentIcon } from '../Icons';

export function MessageSources({ citations, content }: { citations: Citation[] | null; content: string }) {
  const [open, setOpen] = useState(false);
  const claims = (citations || []).filter((span) => (span.sources || []).length > 0);
  if (claims.length === 0) return null;
  const total = claims.reduce((n, span) => n + span.sources.length, 0);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.toggle} onPress={() => setOpen((v) => !v)} accessibilityState={{ expanded: open }}>
        <DocumentIcon size={15} color={colors.inkMuted} />
        <Text style={styles.toggleText}>{total === 1 ? '1 source' : `${total} sources`}</Text>
        {open ? <ChevronDownIcon size={15} color={colors.inkMuted} /> : <ChevronRightIcon size={15} color={colors.inkMuted} />}
      </Pressable>

      {open &&
        claims.map((span, i) => (
          <View key={`${span.start}-${i}`} style={styles.claim}>
            <Text style={styles.claimText}>{plainText(content.slice(span.start, span.end))}</Text>
            {span.sources.map((source, j) => (
              <View key={`${source.title}-${j}`} style={styles.source}>
                <Text style={styles.quote}>“{source.cited_text}”</Text>
                <Text style={styles.where}>
                  {source.title}
                  {source.location ? ` · ${source.location}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4, marginBottom: 8 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  toggleText: { fontFamily: fonts.medium, fontSize: 13, color: colors.inkMuted },
  claim: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.bgPanel,
    borderWidth: 1,
    borderColor: colors.border,
  },
  claimText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.ink },
  source: { marginTop: 8, paddingLeft: 10, borderLeftWidth: 2, borderLeftColor: colors.brandBlue },
  quote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.inkMuted, fontStyle: 'italic' },
  where: { fontFamily: fonts.semibold, fontSize: 12, color: colors.inkMuted, marginTop: 2 },
});
