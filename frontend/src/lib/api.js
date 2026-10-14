const API = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
let csrfToken = "";

export const setCsrfToken = (token) => {
  csrfToken = token || "";
};

export const apiFetch = async (path, options = {}) => {
  const method = String(options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});
  const unsafe = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (unsafe && !csrfToken && !path.endsWith("/api/auth/csrf")) {
    try {
      const response = await fetch(API + "/api/auth/csrf", { credentials: "include" });
      const data = await response.json();
      setCsrfToken(data.csrfToken);
    } catch {}
  }
  if (unsafe && csrfToken) headers.set("X-CSRF-Token", csrfToken);

  return fetch(path.startsWith("http") ? path : API + path, {
    ...options,
    method,
    headers,
    credentials: "include",
  });
};

export const refreshCsrf = async () => {
  const response = await fetch(API + "/api/auth/csrf", { credentials: "include" });
  const data = await response.json();
  setCsrfToken(data.csrfToken);
  return data.csrfToken;
};

export default apiFetch;
