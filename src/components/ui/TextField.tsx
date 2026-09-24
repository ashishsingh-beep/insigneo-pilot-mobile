import React, { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { EyeIcon, EyeOffIcon } from '../Icons';

type Props = TextInputProps & {
  label: string;
  icon?: React.ReactNode;
  // Password field with a show/hide toggle.
  secret?: boolean;
  code?: boolean; // 6-character code entry
};

export const TextField = forwardRef<React.ComponentRef<typeof TextInput>, Props>(function TextFieldView(
  { label, icon, secret, code, style, ...inputProps },
  ref,
) {
  const [revealed, setRevealed] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, inputProps.editable === false && styles.fieldDisabled]}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.inkFaint}
          secureTextEntry={secret && !revealed}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, code && styles.code, style]}
          {...inputProps}
        />
        {secret ? (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            hitSlop={10}
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            {revealed ? <EyeOffIcon color={colors.inkMuted} /> : <EyeIcon color={colors.inkMuted} />}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink, marginBottom: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    paddingHorizontal: 14,
  },
  fieldDisabled: { backgroundColor: colors.bgPanel },
  icon: { marginRight: 10 },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 12,
  },
  code: { letterSpacing: 4, fontSize: 20, fontFamily: fonts.semibold },
});
