// Coloured initials badge. The colour is derived from the id, so a project
// keeps the same one between visits — same scheme as the web app.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const ACCENTS = ['#0f2743', '#0389c3', '#4f9a3a', '#8a5b12', '#6b4d8f', '#a8443f'];

function accentOf(id: string) {
  let hash = 0;
  // Same 32-bit hash as the web app, so a project gets the same colour on both.
  // eslint-disable-next-line no-bitwise
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}

function initialsOf(name: string) {
  return (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export function ProjectMark({ id, name, size = 40 }: { id: string; name: string; size?: number }) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: accentOf(id) }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: fonts.bold, color: colors.white },
});
