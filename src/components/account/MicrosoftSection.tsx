// ---------------------------------------------------------------------------
// Microsoft 365 connect / disconnect.
// ---------------------------------------------------------------------------
// Connect opens Microsoft's sign-in page in the phone's browser (it cannot be
// embedded). After sign-in the backend redirects to the web app; when the
// user switches back here, the status query refetches on app focus and the
// chip flips to Connected. The connection is per user on the server, so one
// made on the web app already shows as connected here.
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { useDisconnectMicrosoft, useMicrosoftStatus, useStartMicrosoftConnect } from '../../hooks/useMicrosoft';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { Button } from '../ui/Button';

const STATUS_TEXT: Record<string, string> = {
  connected: 'Connected',
  reconnect_required: 'Reconnect required',
  disconnected: 'Not connected',
};

export function MicrosoftSection() {
  const { data: status, isLoading, refetch } = useMicrosoftStatus();
  const start = useStartMicrosoftConnect();
  const disconnect = useDisconnectMicrosoft();
  const [awaitingReturn, setAwaitingReturn] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color={colors.inkMuted} />
      </View>
    );
  }
  // Feature switched off server-side (or status unavailable): hide the control.
  if (!status || !status.enabled) return null;

  async function connect() {
    try {
      const url = await start.mutateAsync();
      await Linking.openURL(url);
      setAwaitingReturn(true);
    } catch (err: any) {
      Alert.alert('Could not start the Microsoft sign-in', err?.message || 'Please try again.');
    }
  }

  function confirmDisconnect() {
    Alert.alert('Disconnect Microsoft 365?', 'InsigneoAI will no longer be able to search your mail, calendar and files.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () =>
          disconnect.mutate(undefined, {
            onError: (err: any) => Alert.alert('Could not disconnect Microsoft 365', err?.message || 'Please try again.'),
          }),
      },
    ]);
  }

  const state = status.status || 'disconnected';
  const chipStyle = state === 'connected' ? styles.chipOn : state === 'reconnect_required' ? styles.chipWarn : styles.chipOff;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Microsoft 365</Text>
        <Text style={[styles.chip, chipStyle]}>{STATUS_TEXT[state] || state}</Text>
      </View>
      <Text style={styles.note}>
        Lets InsigneoAI read your Outlook mail, calendar and OneDrive / SharePoint files when answering. Read-only.
      </Text>
      {status.connected && status.msUpn ? <Text style={styles.upn}>as {status.msUpn}</Text> : null}

      {status.connected ? (
        <Button title="Disconnect" variant="secondary" onPress={confirmDisconnect} loading={disconnect.isPending} />
      ) : (
        <>
          <Button
            title={state === 'reconnect_required' ? 'Reconnect Microsoft 365' : 'Connect Microsoft 365'}
            onPress={connect}
            loading={start.isPending}
          />
          {awaitingReturn ? (
            <>
              <Text style={styles.hint}>
                Finish signing in to Microsoft in your browser, then come back to this app.
              </Text>
              <Button title="I've finished — check again" variant="link" onPress={() => refetch()} />
            </>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  chip: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  chipOn: { backgroundColor: '#e7f3e2', color: colors.success },
  chipWarn: { backgroundColor: '#fdf3e1', color: '#8a5b12' },
  chipOff: { backgroundColor: colors.bgPanel, color: colors.inkMuted },
  note: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.inkMuted },
  upn: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  hint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.inkMuted, textAlign: 'center' },
});
