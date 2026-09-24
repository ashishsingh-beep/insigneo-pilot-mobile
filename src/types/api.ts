// ---------------------------------------------------------------------------
// Shapes returned by the backend, after the camelCase normalisation done in
// src/api. Field names follow the backend schemas (domains/*/schemas.py).
// ---------------------------------------------------------------------------

export type User = {
  id: string;
  name: string;
  firstName: string | null;
  email: string;
  role: string;
};

export type Session = {
  token: string;
  refreshToken: string;
  user: User;
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string | null;
  projectId: string | null;
  projectName: string | null;
};

// A claim in an answer and the project documents that support it. start/end
// index into the raw message content.
export type CitationSource = {
  title: string;
  cited_text: string;
  location?: string | null;
};

export type Citation = {
  start: number;
  end: number;
  sources: CitationSource[];
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string | null;
  attachedFilenames: string[] | null;
  attachedFileIds: string[] | null;
  generatedFileIds: string[] | null;
  citations: Citation[] | null;
  model: string | null;
};

export type ConversationDetail = Conversation & {
  messages: Message[];
};

export type UploadedFile = {
  id: string;
  filename: string;
  content_type: string;
  size: number;
};

export type GeneratedFile = {
  id: string;
  filename: string;
  content_type: string;
  file_type: string;
  size: number;
  conversation_id: string;
  message_id: string | null;
};

export type Model = {
  id: string;
  name: string;
  description: string;
};

// Events yielded by the chat stream (POST /chat), normalised.
export type FileProgressEvent = {
  type: 'file_progress';
  stage: string;
  filename: string;
  fmt: string;
  index: number;
  total: number;
  attempt: number | null;
  fileId: string | null;
  tokensOut: number | null;
  heartbeat: boolean;
};

export type ChatEvent =
  | { type: 'start'; conversationId: string; title: string | null; userMessage: Message }
  | { type: 'status'; state: string }
  | FileProgressEvent
  | { type: 'delta'; text: string }
  | { type: 'done'; message: Message }
  | { type: 'error'; message: string };
