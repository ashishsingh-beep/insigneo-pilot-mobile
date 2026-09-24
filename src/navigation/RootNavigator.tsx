// ---------------------------------------------------------------------------
// Signed out -> the auth stack. Signed in -> a drawer (chat + history) with
// the preview and account screens pushed on top.
// ---------------------------------------------------------------------------

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createDrawerNavigator, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerContent } from '../components/drawer/DrawerContent';
import { Logo } from '../components/Logo';
import { AccountScreen } from '../screens/account/AccountScreen';
import { ChangePasswordScreen } from '../screens/account/ChangePasswordScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { FilePreviewScreen } from '../screens/files/FilePreviewScreen';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import type { AppStackParamList, AuthStackParamList, DrawerParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();

const theme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.accent,
    background: colors.bgApp,
    card: colors.bgApp,
    text: colors.ink,
    border: colors.border,
  },
};

const stackHeader = {
  headerStyle: { backgroundColor: colors.bgApp },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17 },
  headerShadowVisible: false,
};

const renderDrawerContent = (props: DrawerContentComponentProps) => <DrawerContent {...props} />;

function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={renderDrawerContent}
      screenOptions={{ headerShown: false, drawerType: 'front', drawerStyle: { width: '84%' } }}
    >
      <Drawer.Screen name="Chat" component={ChatScreen} />
    </Drawer.Navigator>
  );
}

function Splash() {
  return (
    <View style={styles.splash}>
      <Logo height={56} />
      <ActivityIndicator style={styles.spinner} color={colors.inkMuted} />
    </View>
  );
}

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  if (status === 'booting') return <Splash />;

  return (
    <NavigationContainer theme={theme}>
      {status === 'signedIn' ? (
        <AppStack.Navigator screenOptions={stackHeader}>
          <AppStack.Screen name="Main" component={MainDrawer} options={{ headerShown: false }} />
          <AppStack.Screen name="FilePreview" component={FilePreviewScreen} options={{ title: '' }} />
          <AppStack.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
          <AppStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change password' }} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgApp },
  spinner: { marginTop: 24 },
});
