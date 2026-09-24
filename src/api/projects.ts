// ---------------------------------------------------------------------------
// Projects (domains/projects/router.py) — ported from services/projectService.js
// ---------------------------------------------------------------------------
// A project gives a set of chats shared context: its own documents
// (knowledge), its own instructions, and memory the assistant carries between
// chats. The server files a chat under a project when the first turn carries
// project_id.
// ---------------------------------------------------------------------------

import type { KnowledgeItem, Project, ProjectDetail } from '../types/api';
import type { LocalFile } from './files';
import { apiFetch } from './http';

// The ceiling is enforced in tokens and reported per project; this is only a
// fallback for a payload that predates the field.
export const KNOWLEDGE_TOKEN_LIMIT_FALLBACK = 60000;

export function listProjects(): Promise<Project[]> {
  return apiFetch('/projects');
}

export function getProject(id: string): Promise<ProjectDetail> {
  return apiFetch(`/projects/${id}`);
}

export function createProject(input: { name: string; description: string }): Promise<ProjectDetail> {
  return apiFetch('/projects', { method: 'POST', body: { ...input, instructions: '' } });
}

// Send only the fields being changed — omitted fields are left alone.
export function updateProject(
  id: string,
  changes: Partial<Pick<Project, 'name' | 'description' | 'instructions'>>,
): Promise<ProjectDetail> {
  return apiFetch(`/projects/${id}`, { method: 'PATCH', body: changes });
}

// Chats inside the project are kept and move back to the general history
// (detach_conversations=true), same as the web app.
export async function deleteProject(id: string): Promise<void> {
  await apiFetch(`/projects/${id}?detach_conversations=true`, { method: 'DELETE' });
}

export function addKnowledgeFile(projectId: string, file: LocalFile): Promise<KnowledgeItem> {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  return apiFetch(`/projects/${projectId}/knowledge`, { method: 'POST', body: form });
}

export async function deleteKnowledge(projectId: string, itemId: string): Promise<void> {
  await apiFetch(`/projects/${projectId}/knowledge/${itemId}`, { method: 'DELETE' });
}

// Memory is written by the assistant; removing an entry is the user's only
// control over it.
export async function forgetMemory(projectId: string, memoryId: string): Promise<void> {
  await apiFetch(`/projects/${projectId}/memories/${memoryId}`, { method: 'DELETE' });
}

export const knowledgePaths = {
  download: (projectId: string, itemId: string) => `/projects/${projectId}/knowledge/${itemId}/download`,
};
