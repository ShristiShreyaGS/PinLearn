// Returns a normalised http(s) URL, or "" for anything else (e.g. javascript: or data: URIs).
function sanitizeHttpUrl(value) {
  if (typeof value !== "string") return "";

  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

module.exports = { sanitizeHttpUrl };
