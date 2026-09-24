// Create a project, or edit an existing one's name and description.
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { queryClient, queryKeys } from '../../api/queryClient';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { useCreateProject, useUpdateProject } from '../../hooks/useProjects';
import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import type { ProjectDetail } from '../../types/api';
import { authStyles } from '../auth/AuthLayout';

type Props = NativeStackScreenProps<AppStackParamList, 'ProjectForm'>;

export function ProjectFormScreen({ navigation, route }: Props) {
  const projectId = route.params?.projectId;
  const existing = projectId ? queryClient.getQueryData<ProjectDetail>(queryKeys.project(projectId)) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [error, setError] = useState('');

  const create = useCreateProject();
  const update = useUpdateProject(projectId || '');
  const saving = create.isPending || update.isPending;

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Give the project a name.');
      return;
    }
    setError('');
    try {
      if (projectId) {
        await update.mutateAsync({ name: name.trim(), description: description.trim() });
        navigation.goBack();
      } else {
        const created = await create.mutateAsync({ name: name.trim(), description: description.trim() });
        navigation.replace('ProjectDetail', { projectId: created.id, name: created.name });
      }
    } catch (err: any) {
      setError(err?.message || 'Could not save the project.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Name"
          placeholder="e.g. Q3 Client Reporting"
          autoCapitalize="sentences"
          autoFocus
          maxLength={120}
          value={name}
          onChangeText={setName}
        />
        <TextField
          label="Description"
          placeholder="What is this project for?"
          autoCapitalize="sentences"
          multiline
          maxLength={2000}
          style={styles.multiline}
          value={description}
          onChangeText={setDescription}
        />
        {error ? <Text style={authStyles.error}>{error}</Text> : null}
        <Button title={projectId ? 'Save changes' : 'Create project'} onPress={handleSubmit} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: 20 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
});
