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
const QuizCompletion = require("./models/QuizCompletion");
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
const YOUTUBE_CACHE_TTL_MS = Number(process.env.YOUTUBE_CACHE_TTL_MS||6*60*60*1000);
const YOUTUBE_CACHE_VERSION = "study-v4";
const youtubeCache = new Map();
const inFlightYoutubeRequests = new Map();
const QUIZ_API_BASE_URL = process.env.QUIZ_API_BASE_URL || "https://quizapi.io/api/v1";
const QUIZ_TOPIC_ALIASES = {
  DSA: "data structures algorithms",
  AI: "artificial intelligence machine learning",
  DevOps: "devops docker kubernetes"
};

function normalizeTopic(topic) {
  return String(topic || "").trim().toLowerCase();
}

const STUDY_TERMS = [
  "tutorial",
  "course",
  "learn",
  "lesson",
  "lecture",
  "explained",
  "documentation",
  "programming",
  "coding",
  "development",
  "project",
  "guide",
  "beginner",
  "advanced",
  "interview"
];

const ENTERTAINMENT_TERMS = [
  "reaction",
  "reacts",
  "celebrity",
  "bollywood",
  "song",
  "movie",
  "trailer",
  "comedy",
  "roast",
  "vlog",
  "shorts",
  "meme",
  "gossip",
  "short",
  "viral",
  "entertainment",
  "funny",
  "prank"
];
function isStudyVideo(item) {
  const title = String(item?.snippet?.title || "").toLowerCase();
  const text = `${title} ${item?.snippet?.description || ""}`.toLowerCase();
  const hasEntertainmentTerm = ENTERTAINMENT_TERMS.some((term) => text.includes(term));
  const hasStudyTermInTitle = STUDY_TERMS.some((term) => title.includes(term));
  return !hasEntertainmentTerm && hasStudyTermInTitle;
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

function quizApiHeaders() {
  return {
    Authorization: `Bearer ${process.env.QUIZ_API_KEY}`,
    Accept: "application/json"
  };
}

function normalizeQuizList(data) {
  const quizzes = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return quizzes.map((quiz) => ({
    id: String(quiz.id),
    title: quiz.title || "Untitled quiz",
    description: quiz.description || "",
    category: quiz.category || "General",
    difficulty: quiz.difficulty || "mixed",
    questionsCount: Number(quiz.questions_count || quiz.questionsCount || 0)
  }));
}

function normalizeQuestions(data) {
  const questions = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return questions.map((question) => ({
    id: String(question.id),
    question: question.question || question.text || "",
    description: question.description || "",
    answers: Object.entries(question.answers || {})
      .filter(([, value]) => value)
      .map(([key, value]) => ({ key, text: value })),
    // Normalize correct answers keys from e.g. 'answer_a_correct' -> 'answer_a'
    correctAnswers: (() => {
      const raw = question.correct_answers || {};
      const out = {};
      for (const [k, v] of Object.entries(raw)) {
        const match = k.match(/^(answer_[a-zA-Z0-9]+)_correct$/);
        if (match) {
          out[match[1]] = v === true || v === "true";
        }
      }
      return out;
    })()
  }));
}

async function fetchQuizApi(path) {
  if (!process.env.QUIZ_API_KEY) {
    throw new Error("Missing QUIZ_API_KEY");
  }

  const response = await fetch(`${QUIZ_API_BASE_URL}${path}`, {
    headers: quizApiHeaders()
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`QuizAPI request failed: ${response.status} ${responseText}`);
  }

  return response.json();
}

function activityDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Kolkata"
  }).format(new Date());
}

function previousDate(date) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

//console.log(process.env.YOUTUBE_API_KEY);
app.use(cors());
app.get("/api/quizzes", authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || "10", 10)));
    const topic = String(req.query.topic || "").trim();
    const search = String(req.query.search || "").trim();
    const providerTopic = [QUIZ_TOPIC_ALIASES[topic] || topic, search].filter(Boolean).join(" ");
    const topicQuery = providerTopic ? `&topic=${encodeURIComponent(providerTopic)}` : "";
    let quizzes = normalizeQuizList(await fetchQuizApi(`/quizzes?limit=${limit}${topicQuery}`));

    if (quizzes.length === 0 && providerTopic) {
      quizzes = normalizeQuizList(await fetchQuizApi(`/quizzes?limit=${limit}`));
    }

    res.json({ topic, quizzes });
  } catch (error) {
    console.error("Quiz list error:", error);
    res.status(502).json({ message: "Failed to fetch quizzes" });
  }
});

app.get("/api/quizzes/:quizId/questions", authMiddleware, async (req, res) => {
  try {
    const quizId = encodeURIComponent(req.params.quizId);
    const data = await fetchQuizApi(`/questions?quiz_id=${quizId}&include_answers=false`);
    res.json({ questions: normalizeQuestions(data) });
  } catch (error) {
    console.error("Quiz questions error:", error);
    res.status(502).json({ message: "Failed to fetch quiz questions" });
  }
});

app.post("/api/quizzes/:quizId/complete", authMiddleware, async (req, res) => {
  try {
    const quizId = String(req.params.quizId);
    const answers = req.body?.answers && typeof req.body.answers === "object" ? req.body.answers : {};
    const data = await fetchQuizApi(`/questions?quiz_id=${encodeURIComponent(quizId)}&include_answers=true`);
    const questions = normalizeQuestions(data);
    const score = questions.reduce((total, question) => {
      const selected = answers[question.id];
      const expected = Object.entries(question.correctAnswers)
        .filter(([, value]) => value === "true" || value === true)
        .map(([key]) => key)
        .sort();
      const actual = Array.isArray(selected) ? selected.slice().sort() : [selected].filter(Boolean).sort();
      return expected.length > 0 && JSON.stringify(expected) === JSON.stringify(actual) ? total + 1 : total;
    }, 0);
    const date = activityDate();
    const existing = await QuizCompletion.findOne({ userId: req.userId, activityDate: date });

    if (existing) {
      return res.json({ completed: false, score, totalQuestions: questions.length, streak: await getStreak(req.userId) });
    }

    await QuizCompletion.create({
      userId: req.userId,
      quizId,
      title: String(req.body?.title || "Daily Quiz"),
      topic: String(req.body?.topic || ""),
      score,
      totalQuestions: questions.length,
      activityDate: date
    });

    res.status(201).json({ completed: true, score, totalQuestions: questions.length, streak: await getStreak(req.userId) });
  } catch (error) {
    console.error("Quiz completion error:", error);
    res.status(502).json({ message: "Failed to complete quiz" });
  }
});

app.get("/api/streak", authMiddleware, async (req, res) => {
  try {
    res.json(await getStreak(req.userId));
  } catch (error) {
    console.error("Streak error:", error);
    res.status(500).json({ message: "Failed to fetch streak" });
  }
});

// mark activity for today (used for non-quiz actions like saving a resource)
app.post("/api/activity", authMiddleware, async (req, res) => {
  try {
    const date = activityDate();
    // try to create a QuizCompletion record for today if none exists
    const existing = await QuizCompletion.findOne({ userId: req.userId, activityDate: date });
    if (!existing) {
      await QuizCompletion.create({
        userId: req.userId,
        quizId: "activity-save",
        title: String(req.body?.title || "Saved Activity"),
        topic: String(req.body?.topic || ""),
        score: 0,
        totalQuestions: 0,
        activityDate: date
      });
    }
    res.status(201).json({ streak: await getStreak(req.userId) });
  } catch (error) {
    console.error("Activity mark error:", error);
    res.status(500).json({ message: "Failed to mark activity" });
  }
});

async function getStreak(userId) {
  const completions = await QuizCompletion.find({ userId }).sort({ activityDate: -1 }).select("activityDate");
  const dates = new Set(completions.map((item) => item.activityDate));
  let current = 0;
  let cursor = activityDate();
  if (!dates.has(cursor)) cursor = previousDate(cursor);
  while (dates.has(cursor)) {
    current += 1;
    cursor = previousDate(cursor);
  }
  let longest = 0;
  for (const date of dates) {
    let length = 1;
    let next = previousDate(date);
    while (dates.has(next)) {
      length += 1;
      next = previousDate(next);
    }
    longest = Math.max(longest, length);
  }
  return { current, longest, activeToday: dates.has(activityDate()) };
}
app.get("/api/github", async (req, res) => {
  try {
    const topic = String(req.query.topic || "").trim();
    const search = String(req.query.search || "").trim();
    const page = Math.max(1, Number.parseInt(req.query.page || "1", 10));
    const perPage = 9;
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
      `?q=${encodeURIComponent(`${topic} ${search}`.trim())}` +
      `&sort=stars` +
      `&order=desc` +
      `&per_page=${perPage}` +
      `&page=${page}`;
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

    res.json({
      ...data,
      has_next_page: page * perPage < Number(data.total_count || 0)
    });

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
    const topic = String(req.query.topic || "").trim();
    const search = String(req.query.search || "").trim();
    const pageToken = String(req.query.pageToken || "").trim();
    if (!topic) {
      return res.status(400).json({
        error: "topic is required"
      });
    }

    const cacheKey = [
      YOUTUBE_CACHE_VERSION,
      normalizeTopic(topic),
      normalizeTopic(search),
      pageToken
    ].join(":");
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
    const searchQuery = `${topic} ${search} tutorial course programming education`.trim();
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&q=${encodeURIComponent(searchQuery)}` +
      `&type=video` +
      `&maxResults=50` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "") +
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
        .filter((item) => item?.id?.videoId && item?.snippet && isStudyVideo(item))
        .slice(0, 9)
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

      const result = {
        items: videos,
        nextPageToken: data.nextPageToken || ""
      };

      setCachedVideos(cacheKey, result);
      return result;
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
app.get("/api/kanban", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("kanbanColumns");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({ columns: user.kanbanColumns });
  } catch (error) {
    console.error("Error fetching Kanban board:", error);
    res.status(500).json({
      message: "Failed to fetch Kanban board"
    });
  }
});
app.patch("/api/kanban", authMiddleware, async (req, res) => {
  try {
    if (!req.body?.columns || typeof req.body.columns !== "object") {
      return res.status(400).json({
        message: "Kanban columns are required"
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { kanbanColumns: req.body.columns },
      { new: true, runValidators: true }
    ).select("kanbanColumns");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({ columns: user.kanbanColumns });
  } catch (error) {
    console.error("Error saving Kanban board:", error);
    res.status(500).json({
      message: "Failed to save Kanban board"
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
app.patch("/api/resources/note", authMiddleware, async (req, res) => {
  try {
    const { boardId, resourceId, noteIndex, content } = req.body;

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

    if (!Number.isInteger(noteIndex) || !resource.notes[noteIndex]) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    resource.notes[noteIndex].content = content.trim();
    await board.save();

    res.json({
      message: "Note updated",
      notes: resource.notes
    });
  } catch (error) {
    console.error("Error updating note:", error);

    res.status(500).json({
      message: "Failed to update note"
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
