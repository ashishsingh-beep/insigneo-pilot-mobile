// Insigneo brand lockup, drawn from the same SVG as the web app.
//   tone="dark"  -> navy wordmark (on light backgrounds)
//   tone="light" -> white wordmark (on navy backgrounds)
import React, { useMemo } from 'react';
import { SvgXml } from 'react-native-svg';
import { LOGO_XML } from '../assets/logo';

const WORDMARK_NAVY = /#152640/gi;
const ASPECT = 969.5 / 287.8; // from the SVG viewBox

export function Logo({ height = 48, tone = 'dark' }: { height?: number; tone?: 'dark' | 'light' }) {
  const xml = useMemo(
    () => (tone === 'light' ? LOGO_XML.replace(WORDMARK_NAVY, '#FFFFFF') : LOGO_XML),
    [tone],
  );
  return <SvgXml xml={xml} height={height} width={height * ASPECT} accessibilityLabel="Insigneo Wealth" />;
}
