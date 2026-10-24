const config = require("../config/env");
const logger = require("../utils/logger");
const AppError = require("../utils/AppError");
const { fetchProvider } = require("./providerClient");

const PER_PAGE = 9;

async function searchRepositories({ topic, search = "", page = 1 }) {
  if (!config.GITHUB_TOKEN) {
    throw new AppError(503, "GitHub integration is not configured", "NOT_CONFIGURED");
  }

  const params = new URLSearchParams({
    q: `${topic} ${search}`.trim(),
    sort: "stars",
    order: "desc",
    per_page: String(PER_PAGE),
    page: String(page)
  });

  const response = await fetchProvider(`https://api.github.com/search/repositories?${params}`, {
    headers: {
      Authorization: `Bearer ${config.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "PinLearnApp"
    }
  });

  if (!response.ok) {
    logger.error({ status: response.status }, "GitHub API request failed");
    throw new AppError(502, "Failed to fetch GitHub repositories", "UPSTREAM_ERROR");
  }

  const data = await response.json();

  return { ...data, has_next_page: page * PER_PAGE < Number(data.total_count || 0) };
}

module.exports = { searchRepositories };
