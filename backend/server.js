const express = require("express");
const User = require("./models/User");
const bcrypt = require("bcrypt");
const authMiddleware = require("./middleware/authMiddleware");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });
  app.use(express.json());
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
app.get("/api/github", async (req, res) => {
  try {
    const topic = String(req.query.topic || "").trim();
    if (!topic) {
      return res.status(400).json({
        error: "topic is required"
      });
    }

    if (!process.env.GITHUB_TOKEN) {
      return res.status(500).json({
        error: "Missing GITHUB_TOKEN"
      });
    }

    const url =
      `https://api.github.com/search/repositories` +
      `?q=${encodeURIComponent(topic)}` +
      `&sort=stars` +
      `&order=desc` +
      `&per_page=6`;

    const requestOptions = {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    };

    let response;
    try {
      response = await fetch(url, requestOptions);
    } catch (error) {
      if (error?.cause?.code !== "SELF_SIGNED_CERT_IN_CHAIN") {
        throw error;
      }

      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
      response = await fetch(url, requestOptions);
    }

    if (!response.ok) {
      const responseText = await response.text();
      console.error("GitHub API error", response.status, responseText);
      throw new Error(`GitHub API request failed: ${response.status}`);
    }

    const data = await response.json();

    res.json(data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch GitHub repositories",
      details: error.message
    });
  }
});
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
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password, selectedInterests } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }
const hashedPassword=await bcrypt.hash(password,10);
    const user = new User({
      email,
      password:hashedPassword,
      selectedInterests
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        selectedInterests: user.selectedInterests
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Signup failed"
    });
  }
});
app.patch("/api/interests", authMiddleware, async (req, res) => {
  try {
    const selectedInterests = Array.isArray(req.body.selectedInterests)
      ? req.body.selectedInterests
      : [];

    const user = await User.findByIdAndUpdate(
      req.userId,
      { selectedInterests },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        selectedInterests: user.selectedInterests
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to save interests"
    });
  }
});
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
  { userId: user._id },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

res.json({
  message: "Login successful",
  token,
  user: {
    id: user._id,
    email: user.email,
    selectedInterests: user.selectedInterests
  }
});

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Login failed"
    });
  }
});
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You are authenticated",
    userId: req.userId
  });
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
