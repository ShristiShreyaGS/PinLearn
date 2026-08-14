const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT = 5000;
const YOUTUBE_CACHE_TTL_MS = Number(process.env.YOUTUBE_CACHE_TTL_MS || 6 * 60 * 60 * 1000);
const youtubeCache = new Map();
const inFlightYoutubeRequests = new Map();

function normalizeTopic(topic) {
  return String(topic || "").trim().toLowerCase();
}

function getCachedVideos(cacheKey) {
  const entry = youtubeCache.get(cacheKey);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    return null;
  }

  return entry.data;
}

function setCachedVideos(cacheKey, data) {
  youtubeCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + YOUTUBE_CACHE_TTL_MS
  });
}

//console.log(process.env.YOUTUBE_API_KEY);
app.use(cors());
// app.get("/api/github", async (req, res) => {
//   try {
//     const topic = req.query.topic;

//     const url =
//       `https://api.github.com/search/repositories` +
//       `?q=${encodeURIComponent(topic)}` +
//       `&sort=stars` +
//       `&order=desc` +
//       `&per_page=6`;

//     const response = await fetch(url, {
//       headers: {
//         Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
//         Accept: "application/vnd.github+json"
//       }
//     });

//     if (!response.ok) {
//       throw new Error("GitHub API request failed");
//     }

//     const data = await response.json();

//     res.json(data);

//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       error: "Failed to fetch GitHub repositories"
//     });
//   }
// });
app.get("/api/youtube", async (req, res) => {
  try {
    const topic = req.query.topic;
    if (!topic) {
      return res.status(400).json({
        error: "topic is required"
      });
    }

    const cacheKey = normalizeTopic(topic);
    const cachedVideos = getCachedVideos(cacheKey);
    if (cachedVideos) {
      res.set("X-Cache", "HIT");
      return res.json(cachedVideos);
    }

    if (inFlightYoutubeRequests.has(cacheKey)) {
      const sharedResult = await inFlightYoutubeRequests.get(cacheKey);
      res.set("X-Cache", "SHARED");
      return res.json(sharedResult);
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return res.status(500).json({
        error: "Missing YOUTUBE_API_KEY"
      });
    }
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&q=${encodeURIComponent(topic)}` +
      `&type=video` +
      `&maxResults=6` +
      `&key=${process.env.YOUTUBE_API_KEY}`;

    const fetchPromise = (async () => {
      let response;
      try {
        response = await fetch(url);
      } catch (error) {
        if (error?.cause?.code === "SELF_SIGNED_CERT_IN_CHAIN") {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
          response = await fetch(url);
        } else {
          throw error;
        }
      }

      if (!response.ok) {
        const responseText = await response.text();
        console.error("YouTube API error", response.status, responseText);
        throw new Error(`YouTube API request failed: ${response.status}`);
      }

      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      const videos = items
        .filter((item) => item?.id?.videoId && item?.snippet)
        .map((item) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          channel: item.snippet.channelTitle,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          type: "video",
          source: "youtube"
        }));

      setCachedVideos(cacheKey, videos);
      return videos;
    })();

    inFlightYoutubeRequests.set(cacheKey, fetchPromise);

    try {
      const videos = await fetchPromise;
      res.set("X-Cache", "MISS");
      return res.json(videos);
    } finally {
      inFlightYoutubeRequests.delete(cacheKey);
    }

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch YouTube videos",
      details: error.message
    });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
