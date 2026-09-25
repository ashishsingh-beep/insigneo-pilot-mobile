// ---------------------------------------------------------------------------
// App configuration
// ---------------------------------------------------------------------------
// The app talks to the backend running on the developer's PC (Docker maps host
// port 9000 to the API's 8000). The phone must be on the same network as that
// PC. Update the IP below whenever the PC's address changes.
// ---------------------------------------------------------------------------

const DEV_API_BASE_URL = 'http://172.16.16.235:9000/api';
// const PROD_API_BASE_URL = 'https://insigneo.ai/api';

// Local backend only for now. To switch release builds to production, restore:
// export const API_BASE_URL = __DEV__ ? DEV_API_BASE_URL : PROD_API_BASE_URL;
export const API_BASE_URL = DEV_API_BASE_URL;

// Sent with every chat turn so the backend can tell mobile traffic apart from
// web / extension / desktop (see conversations/service.py _ALLOWED_SOURCES).
export const CLIENT_SOURCE = 'mobile';

// Upload limits enforced by the backend (domains/files). Checked client-side
// first so the user gets the message before a long upload fails.
export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
