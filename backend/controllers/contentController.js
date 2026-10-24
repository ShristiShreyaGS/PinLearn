const { searchVideos } = require("../services/youtubeService");
const { searchRepositories } = require("../services/githubService");

async function youtube(req, res) {
  const { topic, search, pageToken } = req.valid.query;
  const { result, cacheStatus } = await searchVideos({ topic, search, pageToken });
  res.set("X-Cache", cacheStatus).json(result);
}

async function github(req, res) {
  const { topic, search, page } = req.valid.query;
  res.json(await searchRepositories({ topic, search, page }));
}

module.exports = { youtube, github };
