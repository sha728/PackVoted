import axios from 'axios';

/**
 * Central Axios instance for all PackVote API calls.
 *
 * We use an empty baseURL ('') so that all requests are relative
 * (e.g., `/api/trips`). In development, Vite's proxy (in vite.config.js)
 * catches `/api` requests and forwards them to FastAPI on port 8000,
 * completely bypassing CORS issues.
 */
/**
 * FastAPI List[str] fix — must use repeated bare keys, not key[]=val.
 * e.g. ?participant_emails=a@x.com&participant_emails=b@x.com
 * Axios default produces ?participant_emails[]=a — FastAPI ignores the rest.
 */
function serializeParams(params) {
  const parts = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) =>
        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`)
      );
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.join('&');
}

const client = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
  paramsSerializer: { serialize: serializeParams },
});

/* ──────────────────────────────────────────────────────────
   Response interceptor
   Normalises every non-2xx error into a plain JS object:
   { message: string, status: number }
   so callers never have to dig into axios error internals.
   ────────────────────────────────────────────────────────── */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';
    let status = 0;

    if (error.response) {
      // Server responded with a non-2xx status
      status = error.response.status;
      const detail = error.response.data?.detail;
      if (typeof detail === 'string') {
        message = detail;
      } else if (typeof error.response.data?.message === 'string') {
        message = error.response.data.message;
      } else {
        message = `Request failed with status ${status}.`;
      }
    } else if (error.request) {
      // Request was sent but no response received (network error)
      message = 'Unable to reach the server. Check your connection.';
    } else {
      // Something went wrong setting up the request
      message = error.message ?? message;
    }

    // Reject with a normalised error shape
    return Promise.reject({ message, status });
  }
);

export default client;
