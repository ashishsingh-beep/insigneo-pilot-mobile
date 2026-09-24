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

// --- Projects (domains/projects/schemas.py) ---------------------------------

export type ProjectConversation = { id: string; title: string; updated_at: string };

export type ProjectMemory = {
  id: string;
  content: string;
  kind: 'auto' | 'explicit';
  created_at: string;
};

export type KnowledgeItem = {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  // A "file" becomes a citable document; an "image" is shown to the model
  // but cannot be quoted from.
  kind: 'file' | 'image';
  status: 'ready' | 'processing' | 'failed';
  error: string | null;
  token_count: number;
  created_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  instructions: string | null;
  created_at: string;
  updated_at: string;
  conversation_count: number;
  knowledge_count: number;
  knowledge_bytes: number;
  knowledge_tokens: number;
  knowledge_token_limit: number;
};

export type ProjectDetail = Project & {
  conversations: ProjectConversation[];
  knowledge: KnowledgeItem[];
  memories: ProjectMemory[];
};

// --- Microsoft 365 (domains/integrations/microsoft/schemas.py) -------------

export type MicrosoftStatus =
  | { enabled: false }
  | {
      enabled: true;
      connected: boolean;
      status: 'disconnected' | 'connected' | 'reconnect_required';
      msUpn: string | null;
      connectedAt: string | null;
      lastError: string | null;
    };

// --- Support tickets (domains/support/schemas.py) ---------------------------

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TicketMessage = {
  id: string;
  ticket_id: string;
  sender_name: string;
  // "user" (the ticket owner), "admin" (support) or "system" (lifecycle notes)
  sender_role: string;
  body: string;
  created_at: string | null;
};

export type Ticket = {
  id: string;
  reference: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to_name: string | null;
  created_at: string | null;
  last_message_at: string | null;
  message_count: number;
  unread_count: number;
  last_message: TicketMessage | null;
};

export type TicketDetail = Ticket & { messages: TicketMessage[] };

export type UnreadSummary = { unread_total: number; tickets_with_unread: number; open_tickets: number };
