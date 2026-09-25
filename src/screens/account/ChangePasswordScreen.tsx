import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoider } from '../../components/ui/KeyboardAvoider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { changePassword } from '../../api/auth';
import { LockIcon } from '../../components/Icons';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { authStyles } from '../auth/AuthLayout';

type Props = NativeStackScreenProps<AppStackParamList, 'ChangePassword'>;

export function ChangePasswordScreen({ navigation }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!current) return setError('Please enter your current password.');
    if (next !== confirm) return setError('New passwords do not match.');
    if (next.length < 6) return setError('New password must be at least 6 characters.');
    setSaving(true);
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Could not update password.');
    } finally {
      setSaving(false);
    }
  }

  const icon = <LockIcon color={colors.inkMuted} />;

  return (
    <KeyboardAvoider>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {done ? (
          <View>
            <Text style={styles.success}>Password updated successfully.</Text>
            <Button title="Done" onPress={() => navigation.goBack()} />
          </View>
        ) : (
          <View>
            <TextField label="Current password" icon={icon} secret autoComplete="current-password" value={current} onChangeText={setCurrent} />
            <TextField label="New password" icon={icon} secret autoComplete="new-password" textContentType="newPassword" value={next} onChangeText={setNext} />
            <TextField
              label="Confirm new password"
              icon={icon}
              secret
              autoComplete="new-password"
              textContentType="newPassword"
              value={confirm}
              onChangeText={setConfirm}
              onSubmitEditing={handleSubmit}
            />
            {error ? <Text style={authStyles.error}>{error}</Text> : null}
            <Button title="Update password" onPress={handleSubmit} loading={saving} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: 20 },
  success: { fontFamily: fonts.medium, fontSize: 16, color: colors.success, marginBottom: 20 },
});
