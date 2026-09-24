// Native markdown for assistant replies: GFM tables, code blocks and $$ maths
// (react-native-enriched-markdown). Memoised so a streaming update to one
// message does not re-render every other reply in the list.
import React, { memo, useMemo } from 'react';
import { Linking } from 'react-native';
import { EnrichedMarkdownText, type MarkdownStyle } from 'react-native-enriched-markdown';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { isSafeLink, prepareAssistantMarkdown } from '../../utils/markdown';

type Props = { content: string; streaming?: boolean };

export const AssistantMarkdown = memo(function AssistantMarkdownView({ content, streaming }: Props) {
  const markdown = useMemo(() => prepareAssistantMarkdown(content), [content]);
  return (
    <EnrichedMarkdownText
      markdown={markdown}
      flavor="github"
      markdownStyle={markdownStyle}
      streamingAnimation={!!streaming}
      selectable
      selectionColor={colors.brandSky}
      onLinkPress={({ url }) => {
        if (isSafeLink(url)) Linking.openURL(url).catch(() => {});
      }}
    />
  );
});

const body = { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.ink };
const heading = { fontFamily: fonts.serifSemibold, color: colors.inkStrong };

const markdownStyle: MarkdownStyle = {
  paragraph: { ...body, marginBottom: 12 },
  h1: { ...heading, fontSize: 26, lineHeight: 32, marginTop: 8, marginBottom: 10 },
  h2: { ...heading, fontSize: 22, lineHeight: 28, marginTop: 8, marginBottom: 8 },
  h3: { ...heading, fontSize: 19, lineHeight: 25, marginTop: 6, marginBottom: 6 },
  h4: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, color: colors.inkStrong, marginBottom: 6 },
  h5: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22, color: colors.inkStrong, marginBottom: 4 },
  h6: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, color: colors.inkMuted, marginBottom: 4 },
  list: { ...body, marginBottom: 12, bulletColor: colors.inkMuted, markerColor: colors.inkMuted, gapWidth: 8, itemSpacing: 4 },
  blockquote: {
    ...body,
    color: colors.inkMuted,
    borderColor: colors.brandBlue,
    borderWidth: 3,
    gapWidth: 12,
    marginBottom: 12,
  },
  strong: { fontFamily: fonts.bold, fontWeight: 'normal' },
  link: { color: colors.brandBlue600, underline: true },
  code: { color: colors.inkStrong, backgroundColor: colors.bgPanel, borderColor: colors.border },
  codeBlock: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    backgroundColor: colors.bgPanel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  table: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    headerFontFamily: fonts.semibold,
    headerBackgroundColor: colors.brandBone,
    headerTextColor: colors.inkStrong,
    rowEvenBackgroundColor: colors.bgCard,
    rowOddBackgroundColor: colors.bgPanel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    cellPaddingHorizontal: 10,
    cellPaddingVertical: 8,
    marginBottom: 12,
  },
  thematicBreak: { color: colors.border, height: 1, marginTop: 8, marginBottom: 16 },
  math: { fontSize: 18, color: colors.ink, backgroundColor: colors.bgPanel, padding: 12, marginBottom: 12 },
  inlineMath: { color: colors.ink },
};
