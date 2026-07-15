// Session storage cache helper — persists data across tab switches within the same session
const PREFIX = 'roomiee_';

export const sessionCache = {
  get(key) {
    try {
      const raw = sessionStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const { data, expiry } = JSON.parse(raw);
      if (Date.now() > expiry) {
        sessionStorage.removeItem(PREFIX + key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  set(key, data, ttlMs = 5 * 60 * 1000) {
    try {
      sessionStorage.setItem(PREFIX + key, JSON.stringify({ data, expiry: Date.now() + ttlMs }));
    } catch { /* quota exceeded — ignore */ }
  },

  remove(key) {
    sessionStorage.removeItem(PREFIX + key);
  },
};
