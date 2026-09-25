// Rename a chat. Alert.prompt is iOS-only, so this is a small modal that
// behaves the same on both platforms.
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { Button } from '../ui/Button';

type Props = {
  visible: boolean;
  initialTitle: string;
  onCancel: () => void;
  onSave: (title: string) => void;
};

export function RenameDialog({ visible, initialTitle, onCancel, onSave }: Props) {
  const [draft, setDraft] = useState(initialTitle);
  useEffect(() => {
    if (visible) setDraft(initialTitle);
  }, [visible, initialTitle]);

  function commit() {
    const next = draft.trim();
    // Empty or unchanged is a cancel — blanking a title is never what was meant.
    if (!next || next === initialTitle) onCancel();
    else onSave(next);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.card}>
          <Text style={styles.title}>Rename chat</Text>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            autoFocus
            selectTextOnFocus
            maxLength={200}
            returnKeyType="done"
            onSubmitEditing={commit}
          />
          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={onCancel} style={styles.btn} />
            <Button title="Save" onPress={commit} style={styles.btn} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.bgCard, borderRadius: 18, padding: 20 },
  title: { fontFamily: fonts.serifSemibold, fontSize: 21, color: colors.inkStrong, marginBottom: 14 },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  btn: { flex: 1 },
});
