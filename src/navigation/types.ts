import type { NavigatorScreenParams } from '@react-navigation/native';
import type { FileSource } from '../api/files';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: { email?: string } | undefined;
  ResetPassword: undefined;
};

export type DrawerParamList = {
  Chat: undefined;
};

export type AppStackParamList = {
  Main: NavigatorScreenParams<DrawerParamList>;
  FilePreview: { source: FileSource; id: string; filename: string; size?: number | null };
  Account: undefined;
  ChangePassword: undefined;
  Projects: undefined;
  ProjectDetail: { projectId: string; name?: string };
  // No projectId = create.
  ProjectForm: { projectId?: string } | undefined;
  Support: undefined;
  NewTicket: undefined;
  Ticket: { ticketId: string; subject?: string };
};
