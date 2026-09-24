import { useMutation, useQuery } from '@tanstack/react-query';
import type { LocalFile } from '../api/files';
import {
  addKnowledgeFile,
  createProject,
  deleteKnowledge,
  deleteProject,
  forgetMemory,
  getProject,
  listProjects,
  updateProject,
} from '../api/projects';
import { queryClient, queryKeys } from '../api/queryClient';
import type { KnowledgeItem, Project, ProjectDetail } from '../types/api';

export function useProjects() {
  return useQuery({ queryKey: queryKeys.projects, queryFn: listProjects });
}

export function useProject(id: string) {
  return useQuery({ queryKey: queryKeys.project(id), queryFn: () => getProject(id) });
}

// Keep the list in step with a project edited or created in the detail view,
// so going back never shows a stale name or count.
function mergeIntoList(next: Project) {
  queryClient.setQueryData<Project[]>(queryKeys.projects, (list) => {
    const current = list || [];
    const merged = current.some((p) => p.id === next.id)
      ? current.map((p) => (p.id === next.id ? { ...p, ...next } : p))
      : [next, ...current];
    return merged.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  });
}

function setDetail(detail: ProjectDetail) {
  queryClient.setQueryData(queryKeys.project(detail.id), detail);
  mergeIntoList(detail);
}

// Recompute the rolled-up counts locally so the meter moves immediately.
function applyKnowledge(projectId: string, fn: (items: KnowledgeItem[]) => KnowledgeItem[]) {
  const detail = queryClient.getQueryData<ProjectDetail>(queryKeys.project(projectId));
  if (!detail) return;
  const knowledge = fn(detail.knowledge || []);
  setDetail({
    ...detail,
    knowledge,
    knowledge_count: knowledge.length,
    knowledge_bytes: knowledge.reduce((sum, k) => sum + (k.size || 0), 0),
    knowledge_tokens: knowledge.reduce((sum, k) => sum + (k.token_count || 0), 0),
  });
}

export function useCreateProject() {
  return useMutation({ mutationFn: createProject, onSuccess: setDetail });
}

export function useUpdateProject(id: string) {
  return useMutation({
    mutationFn: (changes: Parameters<typeof updateProject>[1]) => updateProject(id, changes),
    onSuccess: setDetail,
  });
}

export function useDeleteProject() {
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Project[]>(queryKeys.projects, (list) => (list || []).filter((p) => p.id !== id));
      queryClient.removeQueries({ queryKey: queryKeys.project(id) });
      // Its chats move back to the general history without a project.
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function useAddKnowledge(projectId: string) {
  return useMutation({
    mutationFn: (file: LocalFile) => addKnowledgeFile(projectId, file),
    onSuccess: (item) => applyKnowledge(projectId, (items) => [...items, item]),
  });
}

export function useDeleteKnowledge(projectId: string) {
  return useMutation({
    mutationFn: (itemId: string) => deleteKnowledge(projectId, itemId),
    onSuccess: (_data, itemId) => applyKnowledge(projectId, (items) => items.filter((k) => k.id !== itemId)),
  });
}

export function useForgetMemory(projectId: string) {
  return useMutation({
    mutationFn: (memoryId: string) => forgetMemory(projectId, memoryId),
    onSuccess: (_data, memoryId) => {
      queryClient.setQueryData<ProjectDetail>(queryKeys.project(projectId), (p) =>
        p ? { ...p, memories: (p.memories || []).filter((m) => m.id !== memoryId) } : p,
      );
    },
  });
}
