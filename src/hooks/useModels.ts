import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAvailableModels } from '../api/chat';
import { queryKeys } from '../api/queryClient';
import { useSettingsStore } from '../stores/settingsStore';

// Model catalog for the picker. A saved choice the server no longer offers
// falls back to the first model (the backend lists "auto" first).
export function useModels() {
  const query = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAvailableModels,
    staleTime: 10 * 60_000,
  });
  const selectedModel = useSettingsStore((s) => s.selectedModel);
  const setSelectedModel = useSettingsStore((s) => s.setSelectedModel);

  useEffect(() => {
    const models = query.data;
    if (!models?.length) return;
    if (!selectedModel || !models.some((m) => m.id === selectedModel)) {
      setSelectedModel(models[0].id);
    }
  }, [query.data, selectedModel, setSelectedModel]);

  const models = query.data || [];
  return { models, selected: models.find((m) => m.id === selectedModel) || null };
}
