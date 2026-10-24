const https = require("https");
const config = require("../config/env");
const AppError = require("../utils/AppError");

const DEFAULT_TIMEOUT_MS = 8000;

// Dev-only escape hatch for networks with TLS-intercepting proxies; disabled in production by config.
function requestWithUnverifiedTls(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(
      url,
      { method: options.method || "GET", headers: options.headers, rejectUnauthorized: false },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () =>
          resolve({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            text: async () => body,
            json: async () => JSON.parse(body)
          })
        );
        response.on("error", reject);
      }
    );

    request.setTimeout(DEFAULT_TIMEOUT_MS, () => request.destroy(new Error("Upstream timeout")));
    request.on("error", reject);
    if (options.body) request.write(options.body);
    request.end();
  });
}

async function fetchProvider(url, options = {}) {
  try {
    return await fetch(url, { signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS), ...options });
  } catch (error) {
    if (error?.cause?.code === "SELF_SIGNED_CERT_IN_CHAIN" && config.allowSelfSigned) {
      return requestWithUnverifiedTls(url, options);
    }
    throw new AppError(502, "Upstream service unavailable", "UPSTREAM_UNAVAILABLE");
  }
}

module.exports = { fetchProvider };
