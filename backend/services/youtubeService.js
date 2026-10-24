const config = require("../config/env");
const logger = require("../utils/logger");
const AppError = require("../utils/AppError");
const { fetchProvider } = require("./providerClient");

const CACHE_VERSION = "study-v5";
const MAX_CACHE_ENTRIES = 500;
const PAGE_SIZE = 9;

const cache = new Map();
const inFlight = new Map();

const STUDY_TERMS = [
  "tutorial", "course", "learn", "lesson", "lecture", "explained", "documentation",
  "programming", "coding", "development", "project", "guide", "beginner", "advanced", "interview"
];

const ENTERTAINMENT_TERMS = [
  "reaction", "reacts", "celebrity", "bollywood", "song", "movie", "trailer", "comedy",
  "roast", "vlog", "shorts", "meme", "gossip", "short", "viral", "entertainment", "funny", "prank"
];

const wordMatcher = (terms) => new RegExp(`\\b(?:${terms.join("|")})\\b`, "i");
const studyInTitle = wordMatcher(STUDY_TERMS);
const entertainment = wordMatcher(ENTERTAINMENT_TERMS);

function isStudyVideo(item) {
  const title = String(item?.snippet?.title || "");
  const text = `${title} ${item?.snippet?.description || ""}`;
  return !entertainment.test(text) && studyInTitle.test(title);
}

function readCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function writeCache(key, data) {
  // Bounded: evict the oldest entry (Map preserves insertion order).
  if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(key, { data, expiresAt: Date.now() + config.YOUTUBE_CACHE_TTL_MS });
}

async function fetchFromYoutube({ topic, search, pageToken }) {
  const query = `${topic} ${search} tutorial course programming education`.trim();
  const params = new URLSearchParams({ part: "snippet", q: query, type: "video", maxResults: "50" });
  if (pageToken) params.set("pageToken", pageToken);

  const response = await fetchProvider(`https://www.googleapis.com/youtube/v3/search?${params}`, {
    headers: { "X-Goog-Api-Key": config.YOUTUBE_API_KEY }
  });

  if (!response.ok) {
    logger.error({ status: response.status }, "YouTube API request failed");
    throw new AppError(502, "Failed to fetch YouTube videos", "UPSTREAM_ERROR");
  }

  const data = await response.json();
  const items = Array.isArray(data.items) ? data.items : [];

  return {
    items: items
      .filter((item) => item?.id?.videoId && item?.snippet && isStudyVideo(item))
      .slice(0, PAGE_SIZE)
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        channel: item.snippet.channelTitle,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        type: "video",
        source: "youtube"
      })),
    nextPageToken: data.nextPageToken || ""
  };
}

// Returns { result, cacheStatus } where cacheStatus is HIT, SHARED or MISS.
async function searchVideos({ topic, search = "", pageToken = "" }) {
  if (!config.YOUTUBE_API_KEY) {
    throw new AppError(503, "YouTube integration is not configured", "NOT_CONFIGURED");
  }

  const key = [CACHE_VERSION, topic.toLowerCase(), search.toLowerCase(), pageToken].join(":");

  const cached = readCache(key);
  if (cached) return { result: cached, cacheStatus: "HIT" };

  if (inFlight.has(key)) return { result: await inFlight.get(key), cacheStatus: "SHARED" };

  const pending = fetchFromYoutube({ topic, search, pageToken }).then((result) => {
    writeCache(key, result);
    return result;
  });
  inFlight.set(key, pending);

  try {
    return { result: await pending, cacheStatus: "MISS" };
  } finally {
    inFlight.delete(key);
  }
}

module.exports = { searchVideos, isStudyVideo, _cache: cache };
