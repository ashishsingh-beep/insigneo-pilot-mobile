// Profile, Microsoft 365, help & support, change password and log out.
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MicrosoftSection } from '../../components/account/MicrosoftSection';
import { ChevronRightIcon, HelpIcon, LockIcon, LogoutIcon, UserIcon } from '../../components/Icons';
import { useSupportUnread } from '../../hooks/useSupport';
import type { AppStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

type Props = NativeStackScreenProps<AppStackParamList, 'Account'>;

export function AccountScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [loggingOut, setLoggingOut] = useState(false);
  const unread = useSupportUnread().data?.unread_total || 0;

  function confirmLogout() {
    Alert.alert('Log out?', 'You will need to sign in again to use InsigneoAI.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <UserIcon size={34} color={colors.white} />
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.role}>
          <Text style={styles.roleText}>{user?.role || 'Member'}</Text>
        </View>
      </View>

      <MicrosoftSection />

      <View style={styles.group}>
        <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => navigation.navigate('Support')}>
          <HelpIcon color={colors.ink} />
          <Text style={styles.rowText}>Help & support</Text>
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          ) : null}
          <ChevronRightIcon size={18} color={colors.inkMuted} />
        </Pressable>
      </View>

      <View style={styles.group}>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <LockIcon color={colors.ink} />
          <Text style={styles.rowText}>Change password</Text>
          <ChevronRightIcon size={18} color={colors.inkMuted} />
        </Pressable>
      </View>

      <View style={styles.group}>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={confirmLogout}
          disabled={loggingOut}
        >
          <LogoutIcon color={colors.danger} />
          <Text style={[styles.rowText, styles.danger]}>{loggingOut ? 'Logging out…' : 'Log out'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: 16, gap: 16 },
  profile: { alignItems: 'center', paddingVertical: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontFamily: fonts.serifSemibold, fontSize: 24, color: colors.inkStrong },
  email: { fontFamily: fonts.regular, fontSize: 15, color: colors.inkMuted, marginTop: 2 },
  role: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.brandBone,
  },
  roleText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.inkStrong, textTransform: 'capitalize' },
  group: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  pressed: { backgroundColor: colors.hoverBg },
  rowText: { flex: 1, fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  danger: { color: colors.danger },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.brandBlue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.white },
});
