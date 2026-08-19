const express = require("express");
const User = require("./models/User");
const bcrypt = require("bcrypt");
const authMiddleware = require("./middleware/authMiddleware");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();
const Board = require("./models/Boards");
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
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);

    res.status(500).json({
      message: "Failed to fetch profile",
    });
  }
});
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password, selectedInterests } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }
const hashedPassword=await bcrypt.hash(password,10);
    const user = new User({
      name: (name || "").trim(),
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
        name: user.name,
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
app.patch("/api/profile", authMiddleware, async (req, res) => {
  try {
    const updates = {};

    if (typeof req.body.name === "string") {
      updates.name = req.body.name.trim();
    }

    if (typeof req.body.bio === "string") {
      updates.bio = req.body.bio.trim();
    }

    if (Array.isArray(req.body.selectedInterests)) {
      updates.selectedInterests = req.body.selectedInterests
        .filter((interest) => typeof interest === "string")
        .map((interest) => interest.trim())
        .filter(Boolean);
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "Failed to update profile"
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
    name: user.name,
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
app.get("/api/boards", authMiddleware, async (req, res) => {
  try {
    const boards = await Board.find({
      userId: req.userId
    }).sort({ createdAt: 1 });

    res.json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);

    res.status(500).json({
      message: "Failed to fetch boards"
    });
  }
});
app.post("/api/boards", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Board name is required"
      });
    }

    const trimmedName = name.trim();

    const existingBoard = await Board.findOne({
      userId: req.userId,
      name: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
    });

    if (existingBoard) {
      return res.status(409).json({
        message: "A board with this name already exists"
      });
    }

    const board = await Board.create({
      userId: req.userId,
      name: trimmedName,
      resources: []
    });

    res.status(201).json(board);
  } catch (error) {
    console.error("Error creating board:", error);

    res.status(500).json({
      message: "Failed to create board"
    });
  }
});
app.post("/api/boards/:boardId/resources", authMiddleware, async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({
        message: "Invalid board id"
      });
    }

    const resource = req.body?.resource;

    if (!resource || !resource.title) {
      return res.status(400).json({
        message: "Resource is required"
      });
    }

    const board = await Board.findOne({
      _id: boardId,
      userId: req.userId
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    const resourceId = String(resource.id || resource.url || resource.title);

    const alreadySaved = board.resources.some(
      (saved) => String(saved.id) === resourceId
    );

    if (alreadySaved) {
      return res.status(200).json(board);
    }

    board.resources.push({
      id: resourceId,
      title: resource.title,
      description: resource.description,
      thumbnail: resource.thumbnail || resource.image,
      url: resource.url,
      type: resource.type,
      source: resource.source,
      channel: resource.channel
    });

    await board.save();

    res.status(201).json(board);
  } catch (error) {
    console.error("Error saving resource to board:", error);

    res.status(500).json({
      message: "Failed to save resource"
    });
  }
});
app.patch("/api/progress/status", authMiddleware, async (req, res) => {
  try {
    const { boardId, resourceId, status } = req.body;

    const allowedStatuses = [
      "saved",
      "visited",
      "in_progress",
      "completed"
    ];

    if (
      !boardId ||
      !resourceId ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid request"
      });
    }

    const board = await Board.findOne({
      _id: boardId,
      userId: req.userId
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    const resource = board.resources.find(
      (r) => String(r.id) === String(resourceId)
    );

    if (!resource) {
      return res.status(404).json({
        message: "Resource not found"
      });
    }

    resource.status = status;

    if (status === "visited" && !resource.visitedAt) {
      resource.visitedAt = new Date();
    }

    if (status === "completed" && !resource.completedAt) {
      resource.completedAt = new Date();
    }

    await board.save();

    res.json({
      message: "Status updated",
      resource
    });
  } catch (error) {
    console.error("Error updating resource status:", error);

    res.status(500).json({
      message: "Failed to update status"
    });
  }
});
app.post("/api/resources/note", authMiddleware, async (req, res) => {
  try {
    const { boardId, resourceId, content } = req.body;

    if (!boardId || !resourceId || !content?.trim()) {
      return res.status(400).json({
        message: "Invalid request"
      });
    }

    const board = await Board.findOne({
      _id: boardId,
      userId: req.userId
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    const resource = board.resources.find(
      (r) => String(r.id) === String(resourceId)
    );

    if (!resource) {
      return res.status(404).json({
        message: "Resource not found"
      });
    }

    resource.notes.push({
      content: content.trim()
    });

    await board.save();

    res.json({
      message: "Note added",
      notes: resource.notes
    });
  } catch (error) {
    console.error("Error adding note:", error);

    res.status(500).json({
      message: "Failed to add note"
    });
  }
});
app.delete("/api/resources/note", authMiddleware, async (req, res) => {
  try {
    const { boardId, resourceId, noteIndex } = req.body;

    const board = await Board.findOne({
      _id: boardId,
      userId: req.userId
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    const resource = board.resources.find(
      (r) => String(r.id) === String(resourceId)
    );

    if (!resource) {
      return res.status(404).json({
        message: "Resource not found"
      });
    }

    resource.notes.splice(noteIndex, 1);

    await board.save();

    res.json({
      message: "Note deleted"
    });
  } catch (error) {
    console.error("Error deleting note:", error);

    res.status(500).json({
      message: "Failed to delete note"
    });
  }
});
app.delete("/api/boards/:boardId", authMiddleware, async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res.status(400).json({
        message: "Invalid board id"
      });
    }

    const board = await Board.findOneAndDelete({
      _id: boardId,
      userId: req.userId
    });

    if (!board) {
      return res.status(404).json({
        message: "Board not found"
      });
    }

    res.json({ message: "Board deleted" });
  } catch (error) {
    console.error("Error deleting board:", error);

    res.status(500).json({
      message: "Failed to delete board"
    });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
