const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const PORT = 5000;
//console.log(process.env.YOUTUBE_API_KEY);
app.use(cors());
app.get("/api/youtube", async (req, res) => {
  try {
    const topic = req.query.topic;
    if (!topic) {
      return res.status(400).json({
        error: "topic is required"
      });
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
      `&maxResults=10` +
      `&key=${process.env.YOUTUBE_API_KEY}`;

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
      return res.status(response.status).json({
        error: "YouTube API request failed",
        details: responseText
      });
    }
    const data = await response.json();
    const videos = data.items.map((item) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails.medium.url,
    channel: item.snippet.channelTitle,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    type: "video",
    source: "youtube"
}));

res.json(videos);

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
