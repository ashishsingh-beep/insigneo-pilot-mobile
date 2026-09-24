import React, { useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { forgotPassword } from '../../api/auth';
import { MailIcon } from '../../components/Icons';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import type { AuthStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { AuthLayout, authStyles } from './AuthLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation, route }: Props) {
  const [email, setEmail] = useState(route.params?.email ?? '');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="Enter your email and we'll send a reset code">
      {done ? (
        <View>
          <Text style={authStyles.body}>
            If that email is registered you'll receive a 6-character code shortly.
          </Text>
          <Button title="Enter reset code →" onPress={() => navigation.navigate('ResetPassword')} />
          <Button title="Back to sign in" variant="link" onPress={() => navigation.navigate('Login')} />
        </View>
      ) : (
        <View>
          <TextField
            label="Email"
            icon={<MailIcon color={colors.inkMuted} />}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="send"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={handleSubmit}
          />
          {error ? <Text style={authStyles.error}>{error}</Text> : null}
          <Button title="Send reset code" onPress={handleSubmit} loading={submitting} />
          <Button title="I already have a code" variant="link" onPress={() => navigation.navigate('ResetPassword')} />
          <Button title="Back to sign in" variant="link" onPress={() => navigation.goBack()} />
        </View>
      )}
    </AuthLayout>
  );
}
