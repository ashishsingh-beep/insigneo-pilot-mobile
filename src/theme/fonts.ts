// Font faces bundled from assets/fonts. Each weight is its own file, and the
// file name equals the font's PostScript name, so the same fontFamily string
// works on Android (file name) and iOS (PostScript name). Pick the weight by
// family — do not combine these with fontWeight.
//
// Hanken Grotesk stands in for Aeonik (UI / body), Newsreader for
// Le Monde Livre (editorial headings) — same as the web app.
export const fonts = {
  regular: 'HankenGrotesk-Regular',
  medium: 'HankenGrotesk-Medium',
  semibold: 'HankenGrotesk-SemiBold',
  bold: 'HankenGrotesk-Bold',
  serifMedium: 'Newsreader-Medium',
  serifSemibold: 'Newsreader-SemiBold',
  serifBold: 'Newsreader-Bold',
} as const;
