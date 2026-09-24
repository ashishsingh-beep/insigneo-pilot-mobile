import { useMutation, useQuery } from '@tanstack/react-query';
import { disconnectMicrosoft, getMicrosoftStatus, startMicrosoftConnect } from '../api/microsoft';
import { queryClient, queryKeys } from '../api/queryClient';
import type { MicrosoftStatus } from '../types/api';

// Re-read whenever the app returns to the foreground — that is when the user
// comes back from signing in to Microsoft in the browser.
export function useMicrosoftStatus() {
  return useQuery({
    queryKey: queryKeys.microsoft,
    queryFn: getMicrosoftStatus,
    staleTime: 0,
    refetchOnWindowFocus: 'always',
  });
}

export function useStartMicrosoftConnect() {
  return useMutation({ mutationFn: startMicrosoftConnect });
}

export function useDisconnectMicrosoft() {
  return useMutation({
    mutationFn: disconnectMicrosoft,
    onSuccess: () => {
      queryClient.setQueryData<MicrosoftStatus>(queryKeys.microsoft, (s) =>
        s && s.enabled ? { ...s, connected: false, status: 'disconnected', msUpn: null, lastError: null } : s,
      );
    },
  });
}
