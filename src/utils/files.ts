// ---------------------------------------------------------------------------
// File type helpers — the pure parts of the web app's utils/filePreview.js.
// ---------------------------------------------------------------------------

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.jfif', '.gif', '.webp'];
export const DOCUMENT_EXTENSIONS = ['.txt', '.csv', '.pdf', '.docx', '.xlsx', '.pptx'];
export const ATTACHABLE_EXTENSIONS = [...DOCUMENT_EXTENSIONS, ...IMAGE_EXTENSIONS];

const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export function extensionOf(filename: string | null | undefined): string {
  const name = (filename || '').toLowerCase();
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot) : '';
}

export function mimeTypeOf(filename: string): string {
  return MIME_BY_EXTENSION[extensionOf(filename)] || 'application/octet-stream';
}

export function isImageFile(filename: string | null | undefined): boolean {
  return IMAGE_EXTENSIONS.includes(extensionOf(filename));
}

// Pickers can hand over a file with a useless name; the backend sniffs the
// bytes, so fall back to the MIME type when the name says nothing.
export function isAttachable(name: string, mimeType: string | null): boolean {
  return (
    ATTACHABLE_EXTENSIONS.includes(extensionOf(name)) ||
    IMAGE_MIME_TYPES.includes((mimeType || '').toLowerCase())
  );
}

export function isImageUpload(name: string, mimeType: string | null): boolean {
  return isImageFile(name) || IMAGE_MIME_TYPES.includes((mimeType || '').toLowerCase());
}

export type PreviewKind = 'image' | 'pdf' | 'office' | 'text' | 'markdown' | 'unsupported';

// How the preview screen renders a file. Office documents are shown through
// the server-rendered PDF (/preview), so the phone never parses them.
export function previewKindOf(filename: string): PreviewKind {
  const ext = extensionOf(filename);
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx' || ext === '.xlsx' || ext === '.pptx') return 'office';
  if (ext === '.md' || ext === '.markdown') return 'markdown';
  if (ext === '.txt' || ext === '.csv' || ext === '.json' || ext === '.log') return 'text';
  return 'unsupported';
}

// Short badge label, e.g. "XLSX".
export function formatLabel(filename: string): string {
  return (extensionOf(filename).replace('.', '') || 'file').toUpperCase();
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, '');
  if (bytes < 1024 * 1024) return `${trim(bytes / 1024)} KB`;
  return `${trim(bytes / (1024 * 1024))} MB`;
}
