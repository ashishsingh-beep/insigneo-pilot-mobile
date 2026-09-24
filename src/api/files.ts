// ---------------------------------------------------------------------------
// File upload and authenticated downloads.
// ---------------------------------------------------------------------------
// Every file endpoint needs the Bearer header, so neither <Image> nor the PDF
// viewer can load the URL directly. Instead the bytes are downloaded into the
// app's cache (react-native-blob-util) and the screens open the local file.
// Ids are immutable, so a file already in the cache is reused.
// ---------------------------------------------------------------------------

import ReactNativeBlobUtil from 'react-native-blob-util';
import type { UploadedFile } from '../types/api';
import {
  apiFetch,
  apiUrl,
  authHeader,
  errorFrom,
  handleAuthFailure,
  parseBody,
  refreshSession,
  shouldAttemptRefresh,
} from './http';

export type LocalFile = {
  uri: string;
  name: string;
  type: string;
};

// Multipart upload — returns the id to pass as file_ids on the next turn.
export async function uploadFile(file: LocalFile): Promise<UploadedFile> {
  const form = new FormData();
  // RN's FormData takes a { uri, name, type } descriptor for file parts;
  // content:// (Android) and file:// uris both work.
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  return apiFetch('/files', { method: 'POST', body: form });
}

const CACHE_ROOT = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/insigneo-files`;

function safeName(filename: string): string {
  return filename.replace(/[\\/:*?"<>|]/g, '_') || 'file';
}

export type FileSource = 'uploaded' | 'generated';

// Download paths per kind of file.
export const filePaths = {
  uploadedContent: (id: string) => `/files/${id}/content`,
  generatedContent: (id: string) => `/files/generated/${id}/download`,
  // Server-rendered PDF of an Office document (LibreOffice output).
  renderedPdf: (source: FileSource, id: string) =>
    source === 'generated' ? `/files/generated/${id}/preview` : `/files/${id}/preview`,
};

const inflight = new Map<string, Promise<string>>();

// Downloads `apiPath` to the cache and returns the local file path.
// `cacheKey` must be unique per file + variant (e.g. "gen_<id>" / "pdf_<id>").
export function downloadToCache(apiPath: string, cacheKey: string, filename: string): Promise<string> {
  const existing = inflight.get(cacheKey);
  if (existing) return existing;

  const task = (async () => {
    const dir = `${CACHE_ROOT}/${cacheKey}`;
    const target = `${dir}/${safeName(filename)}`;
    const { fs } = ReactNativeBlobUtil;
    if (await fs.exists(target)) return target;
    if (!(await fs.isDir(dir))) await fs.mkdir(dir);

    const attempt = async () => {
      const res = await ReactNativeBlobUtil.config({ path: target }).fetch('GET', apiUrl(apiPath), authHeader());
      const status = res.info().status;
      if (status >= 200 && status < 300) return { status, data: null };
      // The error body was written to the target file — read it, then remove it
      // so a failed download is never mistaken for a cached file.
      let text: string | null = null;
      try {
        text = await fs.readFile(target, 'utf8');
      } catch {
        text = null;
      }
      await fs.unlink(target).catch(() => {});
      return { status, data: parseBody(text) };
    };

    let res = await attempt();
    if (res.status >= 300 && shouldAttemptRefresh(res.status, res.data) && (await refreshSession())) {
      res = await attempt();
    }
    if (res.status >= 300) {
      handleAuthFailure(res.status, res.data);
      throw errorFrom(res.status, res.data);
    }
    return target;
  })().finally(() => inflight.delete(cacheKey));

  inflight.set(cacheKey, task);
  return task;
}

export function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

export async function readCachedText(path: string): Promise<string> {
  return ReactNativeBlobUtil.fs.readFile(path, 'utf8');
}

// Called on logout: the next user must not see the previous user's files.
export async function clearFileCache(): Promise<void> {
  const { fs } = ReactNativeBlobUtil;
  if (await fs.exists(CACHE_ROOT)) await fs.unlink(CACHE_ROOT).catch(() => {});
}
