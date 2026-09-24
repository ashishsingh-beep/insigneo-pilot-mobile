// Raise a ticket: subject, description and priority.
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PRIORITIES, PRIORITY_LABELS } from '../../api/support';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useCreateTicket } from '../../hooks/useSupport';
import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import type { TicketPriority } from '../../types/api';
import { authStyles } from '../auth/AuthLayout';

type Props = NativeStackScreenProps<AppStackParamList, 'NewTicket'>;

export function NewTicketScreen({ navigation }: Props) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('normal');
  const [error, setError] = useState('');
  const create = useCreateTicket();

  async function handleSubmit() {
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in both the subject and the description.');
      return;
    }
    setError('');
    try {
      const ticket = await create.mutateAsync({ subject: subject.trim(), description: description.trim(), priority });
      navigation.replace('Ticket', { ticketId: ticket.id, subject: ticket.subject });
    } catch (err: any) {
      setError(err?.message || 'Could not raise your ticket. Please try again.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Subject"
          placeholder="What do you need help with?"
          autoCapitalize="sentences"
          value={subject}
          onChangeText={setSubject}
        />
        <TextField
          label="Description"
          placeholder="Tell us what happened, and what you expected to happen."
          autoCapitalize="sentences"
          multiline
          style={styles.multiline}
          value={description}
          onChangeText={setDescription}
        />
        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorities}>
          {PRIORITIES.map((p) => (
            <Pressable key={p} onPress={() => setPriority(p)} style={[styles.priority, priority === p && styles.priorityActive]}>
              <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>{PRIORITY_LABELS[p]}</Text>
            </Pressable>
          ))}
        </View>
        {error ? <Text style={authStyles.error}>{error}</Text> : null}
        <Button title="Submit ticket" onPress={handleSubmit} loading={create.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: 20 },
  multiline: { minHeight: 140, textAlignVertical: 'top' },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink, marginBottom: 8 },
  priorities: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  priority: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  priorityActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  priorityText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  priorityTextActive: { color: colors.white },
});
