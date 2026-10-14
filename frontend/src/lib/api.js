const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
let csrfToken = "";

export const setCsrfToken = (value) => { csrfToken = value || ""; };

export const refreshCsrf = async () => {
  const response = await fetch(API + "/api/auth/csrf", { credentials: "include" });
  if (!response.ok) throw new Error("Could not initialize the security token.");
  const data = await response.json();
  setCsrfToken(data.csrfToken);
  return data.csrfToken;
};

export const apiFetch = async (path, options = {}) => {
  const method = String(options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !csrfToken) {
    try { await refreshCsrf(); } catch {}
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrfToken) headers.set("X-CSRF-Token", csrfToken);
  const url = path.startsWith("http") ? path : API + path;
  return fetch(url, { ...options, method, headers, credentials: "include" });
};
export default apiFetch;
