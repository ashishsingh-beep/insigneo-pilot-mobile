import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LockIcon, MailIcon } from '../../components/Icons';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import type { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../theme/colors';
import { AuthLayout, authStyles } from './AuthLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

// No "Remember me": the app always stays signed in, like Claude's app.
export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((s) => s.login);
  const sessionMessage = useAuthStore((s) => s.sessionMessage);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="User Login" subtitle="Sign in to access your account">
      {sessionMessage && !error ? <Text style={authStyles.notice}>{sessionMessage}</Text> : null}

      <TextField
        label="Email"
        icon={<MailIcon color={colors.inkMuted} />}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        icon={<LockIcon color={colors.inkMuted} />}
        placeholder="Enter your password"
        secret
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={handleSubmit}
      />

      {error ? <Text style={authStyles.error}>{error}</Text> : null}

      <Button title="Sign In" onPress={handleSubmit} loading={submitting} />
      <Button
        title="Forgot password?"
        variant="link"
        style={styles.forgot}
        onPress={() => navigation.navigate('ForgotPassword', { email: email.trim() || undefined })}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  forgot: { marginTop: 6 },
});
