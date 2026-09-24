import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { resetPassword } from '../../api/auth';
import { LockIcon } from '../../components/Icons';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import type { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { AuthLayout, authStyles } from './AuthLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation }: Props) {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!code.trim()) return setError('Please enter the code from your email.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setSubmitting(true);
    try {
      await resetPassword(code, password);
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired reset code.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Set new password" subtitle="Enter the code from your email and choose a new password">
      {done ? (
        <View>
          <Text style={authStyles.body}>Password updated. You can now sign in with your new password.</Text>
          <Button title="Sign in →" onPress={() => navigation.navigate('Login')} />
        </View>
      ) : (
        <View>
          <TextField
            label="Reset code"
            placeholder="6-character code"
            maxLength={6}
            code
            value={code}
            onChangeText={setCode}
          />
          <TextField
            label="New password"
            icon={<LockIcon color={colors.inkMuted} />}
            placeholder="New password"
            secret
            autoComplete="new-password"
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
          />
          <TextField
            label="Confirm password"
            icon={<LockIcon color={colors.inkMuted} />}
            placeholder="Confirm new password"
            secret
            autoComplete="new-password"
            textContentType="newPassword"
            value={confirm}
            onChangeText={setConfirm}
            onSubmitEditing={handleSubmit}
          />
          {error ? <Text style={authStyles.error}>{error}</Text> : null}
          <Button title="Set new password" onPress={handleSubmit} loading={submitting} />
          <Button title="Resend code" variant="link" onPress={() => navigation.navigate('ForgotPassword')} />
        </View>
      )}
    </AuthLayout>
  );
}
