import { useEffect, useState } from 'react';
import { downloadToCache } from '../api/files';

// Downloads a file into the cache (with auth) and returns its local path.
// Pass apiPath = null to skip (e.g. the bytes are already local).
export function useCachedFile(apiPath: string | null, cacheKey: string, filename: string) {
  const [path, setPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiPath) return undefined;
    let cancelled = false;
    setPath(null);
    setError(null);
    downloadToCache(apiPath, cacheKey, filename)
      .then((p) => !cancelled && setPath(p))
      .catch((err) => !cancelled && setError(err?.message || 'Could not load the file.'));
    return () => {
      cancelled = true;
    };
  }, [apiPath, cacheKey, filename]);

  return { path, error, loading: !!apiPath && !path && !error };
}
