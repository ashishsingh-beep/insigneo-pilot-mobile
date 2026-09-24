// All projects, most recently updated first.
import React, { useLayoutEffect } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PlusIcon, ProjectIcon } from '../../components/Icons';
import { ProjectMark } from '../../components/projects/ProjectMark';
import { Button } from '../../components/ui/Button';
import { useProjects } from '../../hooks/useProjects';
import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { relativeTime } from '../../utils/time';

type Props = NativeStackScreenProps<AppStackParamList, 'Projects'>;

export function ProjectsScreen({ navigation }: Props) {
  const { data: projects, isLoading, error, refetch, isRefetching } = useProjects();

  useLayoutEffect(() => {
    const headerRight = () => (
      <Pressable onPress={() => navigation.navigate('ProjectForm')} hitSlop={10} accessibilityLabel="New project">
        <PlusIcon size={24} color={colors.ink} />
      </Pressable>
    );
    navigation.setOptions({ headerRight });
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.inkMuted} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={projects || []}
      keyExtractor={(p) => p.id}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} />}
      ListEmptyComponent={
        error ? (
          <Text style={styles.error}>{(error as Error).message || 'Could not load your projects.'}</Text>
        ) : (
          <View style={styles.empty}>
            <ProjectIcon size={40} color={colors.inkMuted} />
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptyText}>
              A project keeps documents, instructions and related chats together, so every conversation inside it
              already knows the context.
            </Text>
            <Button title="Create your first project" onPress={() => navigation.navigate('ProjectForm')} />
          </View>
        )
      }
      renderItem={({ item: p }) => (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id, name: p.name })}
        >
          <ProjectMark id={p.id} name={p.name} />
          <View style={styles.cardBody}>
            <Text style={styles.name} numberOfLines={1}>
              {p.name}
            </Text>
            <Text style={styles.desc} numberOfLines={2}>
              {p.description || 'No description yet.'}
            </Text>
            <Text style={styles.meta}>
              {p.conversation_count || 0} chats · {p.knowledge_count || 0} items · {relativeTime(p.updated_at)}
            </Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  content: { padding: 16, gap: 10, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgApp },
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.hoverBg },
  cardBody: { flex: 1 },
  name: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  desc: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.inkMuted, marginTop: 2 },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkFaint, marginTop: 6 },
  error: { fontFamily: fonts.regular, fontSize: 15, color: colors.danger, textAlign: 'center', marginTop: 40 },
  empty: { alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 60 },
  emptyTitle: { fontFamily: fonts.serifSemibold, fontSize: 22, color: colors.inkStrong },
  emptyText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.inkMuted, textAlign: 'center', marginBottom: 8 },
});
