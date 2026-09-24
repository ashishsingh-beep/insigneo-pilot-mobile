// ---------------------------------------------------------------------------
// Server-Sent Events over POST — our own client, no library.
// ---------------------------------------------------------------------------
// React Native's fetch cannot read a response body while it is still arriving,
// but its XMLHttpRequest can: with an onprogress handler attached before
// send(), responseText grows as chunks land (on both iOS and Android). Each
// time it grows we take the new tail and split it into SSE frames, the same
// way the web app's apiFetchStream does:
//
//   event: <name>\n
//   data: <json>\n
//   \n
//
// Comment lines (": keep-alive") are ignored. A 401 before streaming starts
// gets one refresh-and-retry, same as apiFetch.
// ---------------------------------------------------------------------------

import {
  apiUrl,
  authHeader,
  errorFrom,
  handleAuthFailure,
  parseBody,
  refreshSession,
  shouldAttemptRefresh,
} from './http';

export type SseFrame = { event: string; data: any };

export type StreamHandle = {
  // Resolves when the stream ends (or is aborted); rejects on a network error
  // or a non-2xx response.
  done: Promise<void>;
  abort: () => void;
};

// Thrown when the connection drops mid-stream (e.g. the OS suspended the app).
export class StreamInterruptedError extends Error {
  constructor() {
    super('Connection lost. Please try again.');
  }
}

function parseFrame(raw: string): SseFrame | null {
  let event = 'message';
  let data = '';
  for (const line of raw.split('\n')) {
    if (line.startsWith(':')) continue; // comment / keep-alive
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) data += line.slice(5).trim();
  }
  if (!data && event === 'message') return null;
  let parsed: unknown = null;
  try {
    parsed = data ? JSON.parse(data) : null;
  } catch {
    parsed = null;
  }
  return { event, data: parsed };
}

type AttemptResult = { status: number; body: string; aborted: boolean };

export function postSse(
  path: string,
  body: unknown,
  onFrame: (frame: SseFrame) => void,
): StreamHandle {
  let xhr: XMLHttpRequest | null = null;
  let aborted = false;

  const attempt = () =>
    new Promise<AttemptResult>((resolve, reject) => {
      const req = new XMLHttpRequest();
      xhr = req;
      let seen = 0; // characters of responseText already consumed
      let buffer = '';
      let streaming = false;

      const drain = (final: boolean) => {
        if (!streaming) return;
        const text = req.responseText || '';
        if (text.length > seen) {
          buffer += text.slice(seen).replace(/\r\n/g, '\n');
          seen = text.length;
        }
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const frame = raw.trim() ? parseFrame(raw) : null;
          if (frame) onFrame(frame);
        }
        if (final && buffer.trim()) {
          const frame = parseFrame(buffer);
          buffer = '';
          if (frame) onFrame(frame);
        }
      };

      req.open('POST', apiUrl(path));
      req.setRequestHeader('Content-Type', 'application/json');
      req.setRequestHeader('Accept', 'text/event-stream');
      const auth = authHeader();
      if (auth.Authorization) req.setRequestHeader('Authorization', auth.Authorization);

      // Must be attached before send() — RN only streams incremental data to
      // requests that listen for it.
      req.onreadystatechange = () => {
        if (req.readyState >= 2 && !streaming) {
          streaming = req.status >= 200 && req.status < 300;
        }
      };
      req.onprogress = () => drain(false);
      req.onload = () => {
        drain(true);
        resolve({ status: req.status, body: streaming ? '' : req.responseText, aborted: false });
      };
      req.onabort = () => resolve({ status: 0, body: '', aborted: true });
      req.onerror = () => {
        if (aborted) resolve({ status: 0, body: '', aborted: true });
        else reject(new StreamInterruptedError());
      };
      req.ontimeout = () => reject(new StreamInterruptedError());

      req.send(JSON.stringify(body));
    });

  const done = (async () => {
    let result = await attempt();
    if (result.aborted) return;

    if (result.status < 200 || result.status >= 300) {
      let data = parseBody(result.body);
      if (shouldAttemptRefresh(result.status, data) && (await refreshSession())) {
        if (aborted) return;
        result = await attempt();
        if (result.aborted) return;
        data = parseBody(result.body);
      }
      if (result.status < 200 || result.status >= 300) {
        handleAuthFailure(result.status, data);
        throw errorFrom(result.status, data);
      }
    }
  })();

  return {
    done,
    abort: () => {
      aborted = true;
      xhr?.abort();
    },
  };
}
