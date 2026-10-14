const RESERVED_ALIASES = new Set([
  "api", "health", "login", "signup", "dashboard", "docs", "terms",
  "privacy", "report", "settings", "links", "preview", "favicon.ico",
]);

const ALIAS_PATTERN = /^[A-Za-z0-9_-]{3,30}$/;

const validateAlias = (value) => {
  const alias = typeof value === "string" ? value.trim() : "";
  if (!alias) return { valid: true, value: null };
  if (!ALIAS_PATTERN.test(alias)) return { valid: false, message: "Alias must be 3–30 characters using letters, numbers, hyphens or underscores." };
  if (RESERVED_ALIASES.has(alias.toLowerCase())) return { valid: false, message: "That alias is reserved. Try another one." };
  return { valid: true, value: alias };
};

module.exports = { validateAlias, RESERVED_ALIASES, ALIAS_PATTERN };
