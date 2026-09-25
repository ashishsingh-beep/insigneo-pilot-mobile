// ---------------------------------------------------------------------------
// One project: start a chat in it, its chats, its knowledge, its instructions
// and its memory. Ported from the detail view of the web app's Projects.jsx.
// ---------------------------------------------------------------------------

import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoider } from '../../components/ui/KeyboardAvoider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { KNOWLEDGE_TOKEN_LIMIT_FALLBACK } from '../../api/projects';
import {
  BookIcon,
  CameraIcon,
  DocumentIcon,
  HistoryIcon,
  ImageIcon,
  PencilIcon,
  SparkIcon,
  TrashIcon,
} from '../../components/Icons';
import { ProjectMark } from '../../components/projects/ProjectMark';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import {
  useAddKnowledge,
  useDeleteKnowledge,
  useDeleteProject,
  useForgetMemory,
  useProject,
  useUpdateProject,
} from '../../hooks/useProjects';
import type { AppStackParamList } from '../../navigation/types';
import { useChatStore } from '../../stores/chatStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import type { ProjectDetail } from '../../types/api';
import { formatBytes } from '../../utils/files';
import { pickDocuments, pickFromCamera, pickFromPhotos, type PickResult } from '../../utils/pickers';
import { relativeTime } from '../../utils/time';

type Props = NativeStackScreenProps<AppStackParamList, 'ProjectDetail'>;

// Every document is sent with every message in the project, so the meter shows
// a running cost in tokens, not disk usage.
function knowledgeMeter(project: ProjectDetail) {
  const used = project.knowledge_tokens || 0;
  const limit = project.knowledge_token_limit || KNOWLEDGE_TOKEN_LIMIT_FALLBACK;
  return { used, limit, pct: Math.min(100, Math.round((used / limit) * 100)) };
}

function Section({ icon, title, note, children }: { icon: React.ReactNode; title: string; note: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.note}>{note}</Text>
      {children}
    </View>
  );
}

export function ProjectDetailScreen({ navigation, route }: Props) {
  const { projectId } = route.params;
  const { data: project, isLoading, error, refetch, isRefetching } = useProject(projectId);
  const update = useUpdateProject(projectId);
  const remove = useDeleteProject();
  const addKnowledge = useAddKnowledge(projectId);
  const deleteKnowledge = useDeleteKnowledge(projectId);
  const forgetMemory = useForgetMemory(projectId);

  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);

  const [instructions, setInstructions] = useState('');
  const [dirty, setDirty] = useState(false);

  // Take the server's instructions until the user starts editing.
  useEffect(() => {
    if (project && !dirty) setInstructions(project.instructions || '');
  }, [project, dirty]);

  useLayoutEffect(() => {
    const headerRight = () => (
      <Pressable onPress={() => setMenuOpen(true)} hitSlop={10} accessibilityLabel="Project actions">
        <Text style={styles.more}>⋯</Text>
      </Pressable>
    );
    navigation.setOptions({ title: project?.name || route.params.name || 'Project', headerRight });
  }, [navigation, project?.name, route.params.name]);

  function startChat() {
    if (!project) return;
    useChatStore.getState().newChat({ id: project.id, name: project.name });
    navigation.navigate('Main', { screen: 'Chat' });
  }

  function openChat(conversationId: string) {
    if (!project) return;
    useChatStore.getState().openConversation(conversationId, { project: { id: project.id, name: project.name } });
    navigation.navigate('Main', { screen: 'Chat' });
  }

  async function saveInstructions() {
    try {
      await update.mutateAsync({ instructions });
      setDirty(false);
    } catch (err: any) {
      Alert.alert('Could not save the instructions', err?.message || 'Please try again.');
    }
  }

  async function addFiles(picker: () => Promise<PickResult>) {
    const { files, error: pickError } = await picker();
    setKnowledgeError(pickError);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const f of files) {
        await addKnowledge.mutateAsync({ uri: f.uri, name: f.name, type: f.type });
      }
    } catch (err: any) {
      setKnowledgeError(err?.message || 'Could not add that to the project.');
    } finally {
      setUploading(false);
    }
  }

  function confirmDeleteProject() {
    if (!project) return;
    Alert.alert(
      `Delete “${project.name}”?`,
      'The project, its knowledge and its instructions are removed. Chats started inside it are kept and move back to your general history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete project',
          style: 'destructive',
          onPress: () =>
            remove.mutate(project.id, {
              onSuccess: () => {
                // The open chat no longer belongs to a project.
                const chat = useChatStore.getState();
                if (chat.project?.id === project.id) useChatStore.setState({ project: null });
                navigation.goBack();
              },
              onError: (err: any) => Alert.alert('Could not delete the project', err?.message || 'Please try again.'),
            }),
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.inkMuted} />
      </View>
    );
  }
  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{(error as Error)?.message || 'Could not open this project.'}</Text>
        <Button title="Try again" variant="secondary" onPress={() => refetch()} style={styles.retry} />
      </View>
    );
  }

  const meter = knowledgeMeter(project);

  return (
    <KeyboardAvoider>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
      >
        <View style={styles.hero}>
          <ProjectMark id={project.id} name={project.name} size={52} />
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{project.name}</Text>
            {project.description ? <Text style={styles.heroDesc}>{project.description}</Text> : null}
          </View>
        </View>

        <Button title="New chat in this project" onPress={startChat} />
        <View style={styles.hint}>
          <SparkIcon size={14} color={colors.inkMuted} />
          <Text style={styles.hintText}>Chats here can read the project's instructions, knowledge and memory.</Text>
        </View>

        {/* ---- chats ---- */}
        <Section icon={<HistoryIcon size={18} color={colors.inkStrong} />} title="Chats in this project" note="">
          {project.conversations.length === 0 ? (
            <Text style={styles.empty}>No chats yet. Start one above and it will be kept here.</Text>
          ) : (
            project.conversations.map((c) => (
              <Pressable key={c.id} style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => openChat(c.id)}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {c.title}
                </Text>
                <Text style={styles.rowMeta}>{relativeTime(c.updated_at)}</Text>
              </Pressable>
            ))
          )}
        </Section>

        {/* ---- knowledge ---- */}
        <Section
          icon={<BookIcon size={18} color={colors.inkStrong} />}
          title="Project knowledge"
          note="Documents every chat in this project can read and quote from."
        >
          <View style={styles.meterBar}>
            <View style={[styles.meterFill, { width: `${meter.pct}%` }, meter.pct >= 90 && styles.meterFull]} />
          </View>
          <Text style={styles.meterText}>
            {meter.used.toLocaleString()} of {meter.limit.toLocaleString()} tokens
            {project.knowledge_bytes > 0 ? ` · ${formatBytes(project.knowledge_bytes)}` : ''}
          </Text>

          <Button
            title={uploading ? 'Adding…' : 'Add files'}
            variant="secondary"
            onPress={() => setAddOpen(true)}
            loading={uploading}
            style={styles.addBtn}
          />
          {knowledgeError ? <Text style={styles.inlineError}>{knowledgeError}</Text> : null}

          {project.knowledge.length === 0 ? (
            <Text style={styles.empty}>Nothing added yet.</Text>
          ) : (
            project.knowledge.map((k) => (
              <View key={k.id} style={styles.row}>
                {k.kind === 'image' ? <ImageIcon size={17} color={colors.inkMuted} /> : <DocumentIcon size={17} color={colors.inkMuted} />}
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {k.filename}
                  </Text>
                  <Text style={[styles.rowMeta, k.status === 'failed' && styles.failed]}>
                    {formatBytes(k.size || 0)}
                    {/* The API cannot quote from inside an image, so it never carries a citation. */}
                    {k.kind === 'image' ? ' · cannot be quoted' : ''}
                    {k.status === 'processing' ? ' · processing…' : ''}
                    {k.status === 'failed' ? ` · failed${k.error ? `: ${k.error}` : ''}` : ''}
                  </Text>
                </View>
                <Pressable
                  hitSlop={10}
                  accessibilityLabel={`Remove ${k.filename}`}
                  onPress={() =>
                    deleteKnowledge.mutate(k.id, {
                      onError: (err: any) => setKnowledgeError(err?.message || 'Could not remove that item.'),
                    })
                  }
                >
                  <TrashIcon size={17} color={colors.inkMuted} />
                </Pressable>
              </View>
            ))
          )}
        </Section>

        {/* ---- instructions ---- */}
        <Section
          icon={<SparkIcon size={18} color={colors.inkStrong} />}
          title="Instructions"
          note="Standing directions for every chat here — tone, format, what to assume."
        >
          <TextInput
            style={styles.instructions}
            multiline
            textAlignVertical="top"
            maxLength={20000}
            placeholder="e.g. Always answer as a compliance-aware analyst. Cite the source document for every figure."
            placeholderTextColor={colors.inkFaint}
            value={instructions}
            onChangeText={(t) => {
              setInstructions(t);
              setDirty(true);
            }}
          />
          <View style={styles.instructionsFoot}>
            <Text style={styles.rowMeta}>{dirty ? 'Unsaved changes' : 'Saved'}</Text>
            <Button title="Save" onPress={saveInstructions} loading={update.isPending} disabled={!dirty} style={styles.saveBtn} />
          </View>
        </Section>

        {/* ---- memory ---- */}
        <Section
          icon={<BookIcon size={18} color={colors.inkStrong} />}
          title="Memory"
          note="Facts picked up from chats in this project, carried into every new one. Remove anything that is wrong or out of date."
        >
          {project.memories.length === 0 ? (
            <Text style={styles.empty}>
              Nothing remembered yet. Ask the assistant to remember something, or just keep chatting — it picks things up on its own.
            </Text>
          ) : (
            project.memories.map((m) => (
              <View key={m.id} style={styles.row}>
                <View style={styles.rowBody}>
                  <Text style={styles.memory}>{m.content}</Text>
                  <Text style={styles.rowMeta}>
                    {m.kind === 'explicit' ? 'You asked to remember this' : 'Picked up automatically'}
                    {m.created_at ? ` · ${relativeTime(m.created_at)}` : ''}
                  </Text>
                </View>
                <Pressable
                  hitSlop={10}
                  accessibilityLabel="Forget this"
                  onPress={() =>
                    forgetMemory.mutate(m.id, {
                      onError: (err: any) => Alert.alert('Could not remove that memory', err?.message || 'Please try again.'),
                    })
                  }
                >
                  <TrashIcon size={17} color={colors.inkMuted} />
                </Pressable>
              </View>
            ))
          )}
        </Section>
      </ScrollView>

      <Sheet
        visible={menuOpen}
        title={project.name}
        onClose={() => setMenuOpen(false)}
        options={[
          {
            key: 'edit',
            label: 'Edit name and description',
            icon: <PencilIcon color={colors.ink} />,
            onPress: () => navigation.navigate('ProjectForm', { projectId: project.id }),
          },
          {
            key: 'delete',
            label: 'Delete project',
            destructive: true,
            icon: <TrashIcon color={colors.danger} />,
            onPress: confirmDeleteProject,
          },
        ]}
      />
      <Sheet
        visible={addOpen}
        title="Add to project knowledge"
        onClose={() => setAddOpen(false)}
        options={[
          { key: 'files', label: 'Files', description: 'PDF, Word, Excel, PowerPoint, CSV, TXT', icon: <DocumentIcon color={colors.ink} />, onPress: () => addFiles(pickDocuments) },
          { key: 'photos', label: 'Photos', icon: <ImageIcon color={colors.ink} />, onPress: () => addFiles(pickFromPhotos) },
          { key: 'camera', label: 'Camera', icon: <CameraIcon color={colors.ink} />, onPress: () => addFiles(pickFromCamera) },
        ]}
      />
    </KeyboardAvoider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bgApp },
  errorText: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center' },
  retry: { marginTop: 16 },
  more: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink },
  hero: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  heroText: { flex: 1 },
  heroName: { fontFamily: fonts.serifSemibold, fontSize: 24, color: colors.inkStrong },
  heroDesc: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.inkMuted, marginTop: 2 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -4 },
  hintText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.inkMuted },
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.inkStrong },
  note: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.inkMuted, marginTop: 4, marginBottom: 8 },
  empty: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.inkMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: { backgroundColor: colors.hoverBg },
  rowBody: { flex: 1 },
  rowTitle: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  rowMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  failed: { color: colors.danger },
  memory: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.ink },
  meterBar: { height: 6, borderRadius: 3, backgroundColor: colors.bgPanel, overflow: 'hidden' },
  meterFill: { height: '100%', backgroundColor: colors.brandBlue600 },
  meterFull: { backgroundColor: colors.danger },
  meterText: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted, marginTop: 6 },
  addBtn: { marginTop: 12, marginBottom: 6, minHeight: 42 },
  inlineError: { fontFamily: fonts.regular, fontSize: 13, color: colors.danger, marginBottom: 6 },
  instructions: {
    minHeight: 130,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
  },
  instructionsFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  saveBtn: { minHeight: 40, paddingHorizontal: 22 },
});
