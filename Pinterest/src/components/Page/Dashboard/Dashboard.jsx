import "./Dashboard.css";
import ResourceCard from "../../ResourceCard/ResourceCard";
import { useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { fetchRepositories, fetchVideos } from "../../../api/content";
import { getProfile } from "../../../api/user";
import PageBackdrop from "../PageBackdrop";
const VIDEO_CACHE_KEY = "pinlearn_video_cache_v3";
const VIDEO_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
function readVideoCache() {
  try {
    const raw = localStorage.getItem(VIDEO_CACHE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeVideoCache(cache) {
  try {
    localStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
  }
}

function resourceKey(resource) {
  return resource?.id || resource?.url || resource?.title;
}

const FALLBACK_INTERESTS = [
  "React",
  "JavaScript",
  "AI",
  "Playwright",
  "DSA",
  "Node.js",
  "Python",
  "Angular",
  "DevOps"
];

const RESOURCES = [];

// const RESOURCES = [
//   {
//     id: 1,
//     topic: "React",
//     type: "Video",
//     title: "React Hooks Explained",
//     description: "Learn the basics of React Hooks.",
//     image: "https://placehold.co/600x400"
//   },
//   {
//     id: 2,
//     topic: "React",
//     type: "Article",
//     title: "Understanding React Components",
//     description: "A beginner-friendly guide to React components.",
//     image: "https://placehold.co/600x400"
//   },
//   {
//     id: 3,
//     topic: "React",
//     type: "Repository",
//     title: "React Projects",
//     description: "Explore projects built using React.",
//     image: "https://placehold.co/600x400"
//   },
//   {
//     id: 4,
//     topic: "React",
//     type: "Project",
//     title: "React Dashboard",
//     description: "A dashboard project built with React.",
//     image: "https://placehold.co/600x400"
//   },
//   {
//     id: 5,
//     topic: "AI",
//     type: "Video",
//     title: "Introduction to AI",
//     description: "Understand the basics of Artificial Intelligence.",
//     image: "https://placehold.co/600x400"
//   },
//   {
//     id: 6,
//     topic: "AI",
//     type: "Article",
//     title: "How AI Works",
//     description: "An introduction to modern AI concepts.",
//     image: "https://placehold.co/600x400"
//   },
//   {
//     id: 7,
//     topic: "AI",
//     type: "Repository",
//     title: "Awesome AI Projects",
//     description: "Explore interesting AI projects.",
//     image: "https://placehold.co/600x400"
//   },
//   {
//     id: 8,
//     topic: "Playwright",
//     type: "Video",
//     title: "Playwright Basics",
//     description: "Get started with Playwright testing.",
//     image: "https://placehold.co/600x400"
//   },
//   {
//     id: 9,
//     topic: "Playwright",
//     type: "Article",
//     title: "Understanding Playwright Fixtures",
//     description: "Learn about reusable Playwright fixtures.",
//     image: "https://placehold.co/600x400"
//   },
//   {
//     id: 10,
//     topic: "Playwright",
//     type: "Repository",
//     title: "Playwright Examples",
//     description: "Explore Playwright automation examples.",
//     image: "https://placehold.co/600x400"
//   }
// ];

function Dashboard({
  boards = [],
  createBoard = async () => {},
  saveResourceToBoard = async () => {},
  refreshBoards
}) {
  const routerData = useLocation();
  const routeInterests = routerData.state?.selectedInterests ?? [];
  const [selectedInterests, setSelectedInterests] = useState(routeInterests);
  const [savedResources, setSavedResources] = useState([]);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [resourceToSave, setResourceToSave] = useState(null);
const [savedMessage,setSavedMessage]=useState("");
const [boardError, setBoardError] = useState("");
const [videosByInterest, setVideosByInterest] = useState({});
const [repositoriesByInterest, setRepositoriesByInterest] = useState({});

  useEffect(() => {
    let isMounted = true;

    const loadCurrentInterests = async () => {
      try {
        const profile = await getProfile();
        if (isMounted && Array.isArray(profile.selectedInterests)) {
          setSelectedInterests(profile.selectedInterests);
        }
      } catch (error) {
        console.error("Failed to load current interests:", error);
      }
    };

    loadCurrentInterests();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const allSaved = boards.flatMap((board) => board.resources || []);
    const deduped = [];
    const seen = new Set();

    for (const resource of allSaved) {
      const key = resourceKey(resource);
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      deduped.push(resource);
    }

    setSavedResources(deduped);
  }, [boards]);

  useEffect(() => {
    if (refreshBoards) {
      refreshBoards();
    }
  }, [refreshBoards]);

  const showSavedMessage = (message) => {
    setSavedMessage(message);
    setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  };

  const createBoardAndSave = async () => {
    const trimmedBoardName = newBoardName.trim();
    if (!trimmedBoardName) {
      return;
    }

    const existingBoard = boards.find(
      (board) => board.name.toLowerCase() === trimmedBoardName.toLowerCase()
    );

    if (existingBoard) {
      await saveToBoard(existingBoard._id);
      setNewBoardName("");
      setShowCreateBoard(false);
      return;
    }

    try {
      setBoardError("");
      const newBoard = await createBoard(trimmedBoardName);

      if (resourceToSave) {
        await saveResourceToBoard(newBoard._id, resourceToSave);
        showSavedMessage(`Saved to "${trimmedBoardName}"`);
      }

      setNewBoardName("");
      setShowCreateBoard(false);
      setShowBoardSelector(false);
      setResourceToSave(null);
    } catch (error) {
      setBoardError(error.message);
    }
  };

  const interestsToRender = useMemo(() => {
    return selectedInterests.length
      ? selectedInterests
      : FALLBACK_INTERESTS;
  }, [selectedInterests]);

  useEffect(() => {
    let isMounted = true;
    const fetchVideosByInterest = async () => {
      try {
        const now = Date.now();
        const cache = readVideoCache();
        const hydrated = {};
        const interestsToFetch = [];

        for (const interest of interestsToRender) {
          const cacheEntry = cache[interest];
          if (
            cacheEntry &&
            Array.isArray(cacheEntry.data) &&
            now - cacheEntry.savedAt < VIDEO_CACHE_TTL_MS
          ) {
            hydrated[interest] = cacheEntry.data;
          } else {
            interestsToFetch.push(interest);
          }
        }

        if (isMounted && Object.keys(hydrated).length > 0) {
          setVideosByInterest((previous) => ({
            ...previous,
            ...hydrated
          }));
        }

        if (interestsToFetch.length === 0) {
          return;
        }

        const entries = await Promise.all(
          interestsToFetch.map(async (interest) => {
            const videos = await fetchVideos(interest);
            return [interest, videos];
          })
        );

        const fetchedVideos = Object.fromEntries(entries);
        const updatedCache = { ...cache };
        for (const [interest, videos] of Object.entries(fetchedVideos)) {
          updatedCache[interest] = {
            data: videos,
            savedAt: now
          };
        }
        writeVideoCache(updatedCache);

        if (isMounted) {
          setVideosByInterest((previous) => ({
            ...previous,
            ...fetchedVideos
          }));
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchVideosByInterest();

    return () => {
      isMounted = false;
    };
  }, [interestsToRender]);

  useEffect(() => {
    let isMounted = true;

    const fetchRepositoriesByInterest = async () => {
      try {
        const results = await Promise.allSettled(
          interestsToRender.map(async (interest) => {
            const repositories = await fetchRepositories(interest);
            return [interest, repositories];
          })
        );
        const entries = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value);

        if (isMounted) {
          setRepositoriesByInterest(Object.fromEntries(entries));
        }

        results
          .filter((result) => result.status === "rejected")
          .forEach((result) => {
            console.error("Error fetching GitHub repositories:", result.reason);
          });
      } catch (error) {
        console.error("Error fetching GitHub repositories:", error);
      }
    };

    fetchRepositoriesByInterest();

    return () => {
      isMounted = false;
    };
  }, [interestsToRender]);

  const openBoardSelector = (resource) => {
    setResourceToSave(resource);
    setShowCreateBoard(false);
    setNewBoardName("");
    setBoardError("");
    setShowBoardSelector(true);
  };

  const saveToBoard = async (boardId) => {
  const selectedBoard = boards.find(
    (board) => board._id === boardId
  );

  if (!selectedBoard || !resourceToSave) {
    return;
  }

  const keyToSave = resourceKey(resourceToSave);

  const alreadySaved = (selectedBoard.resources || []).some(
    (resource) => resourceKey(resource) === keyToSave
  );

  if (alreadySaved) {
    setShowBoardSelector(false);
    setResourceToSave(null);
    showSavedMessage(`Already saved to "${selectedBoard.name}"`);
    return;
  }

  try {
    setBoardError("");
    await saveResourceToBoard(boardId, resourceToSave);

    setShowBoardSelector(false);
    setResourceToSave(null);
    showSavedMessage(`Saved to "${selectedBoard.name}"`);
  } catch (error) {
    setBoardError(error.message);
  }
};

  return (
    <div className="dashboard relative isolate">
      <PageBackdrop className="pointer-events-none absolute inset-0 z-0 min-h-full" />
      <main className="dashboard-content">

  <div className="welcome-section">

    <p className="small-heading">
      YOUR PERSONALIZED FEED
    </p>

    <h1>
      Learn something interesting today.
    </h1>

    <p>
      A collection of things worth exploring,
      based on what you're into.
    </p>

  </div>


        <div className="interest-pills">

          {selectedInterests.map((interest) => (
            <span key={interest}>
              {interest}
            </span>
          ))}

        </div>
        {interestsToRender.map((interest) => {

          const interestResources = RESOURCES.filter(
            (resource) => resource.topic === interest
          );

          const interestVideos = videosByInterest[interest] || [];

          const articles = interestResources.filter(
            (resource) => resource.type === "Article"
          );

          const repositories = interestResources.filter(
            (resource) => resource.type === "Repository"
          );
          const githubRepositories = repositoriesByInterest[interest] || [];

          const projects = interestResources.filter(
            (resource) => resource.type === "Project"
          );
          return (
            <section key={interest}>

              <div className="section-heading">
                <h2>{interest}</h2>
                <button>See all</button>
              </div>

              {interestVideos.length > 0 && (
                <>
                  <h3>Videos</h3>

                  <div className="content-grid">

                    {interestVideos.map((video) => (
                      <ResourceCard
                        key={video.id}
                        resource={video}
                        onSave={openBoardSelector}
                        isSaved={savedResources.some(
                          (saved) => saved.id === video.id
                        )}
                      />
                    ))}

                  </div>
                </>
              )}

              {articles.length > 0 && (
                <>
                  <h3>Articles</h3>

                  <div className="content-grid">

                    {articles.map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        onSave={openBoardSelector}
                        isSaved={savedResources.some(
                          (saved) => saved.id === resource.id
                        )}
                      />
                    ))}

                  </div>
                </>
              )}

              {(githubRepositories.length > 0 || repositories.length > 0) && (
                <>
                  <h3>Repositories</h3>

                  <div className="content-grid">

                    {[...githubRepositories, ...repositories].map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        onSave={openBoardSelector}
                        isSaved={savedResources.some(
                          (saved) => saved.id === resource.id
                        )}
                      />
                    ))}

                  </div>
                </>
              )}

              {projects.length > 0 && (
                <>
                  <h3>Projects</h3>

                  <div className="content-grid">

                    {projects.map((resource) => (
                      <ResourceCard
                        key={resource.id}
                        resource={resource}
                        onSave={openBoardSelector}
                        isSaved={savedResources.some(
                          (saved) => saved.id === resource.id
                        )}
                      />
                    ))}

                  </div>
                </>
              )}

            </section>
          );
        })}

        {showBoardSelector && (
          <div className="board-selector">

            <h3>Save to Board</h3>
            <button
            className="close-button"
            onClick={()=>setShowBoardSelector(false)}
>
  ×
</button>
            <h4>Existing Boards</h4>
            {boards.length > 0 ? (
              boards.map((board) => (
                <button
                  key={board._id}
                  onClick={() => saveToBoard(board._id)}
                >
                  {board.name}
                </button>

              ))
            ) : (
              <p>No boards yet. Create one to save this resource.</p>
            )}

            <button onClick={() => setShowCreateBoard(true)}>
              + Create New Board
            </button>

            {boardError && (
              <p className="board-error">{boardError}</p>
            )}

            {showCreateBoard && (
              <div className="create-board-form">

                <input
                  type="text"
                  placeholder="Enter board name"
                  value={newBoardName}
                  autoFocus
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      createBoardAndSave();
                    }
                  }}
                />

                <button onClick={createBoardAndSave}>
                  Create
                </button>

              </div>
              
            )}
          </div>
          
        )}
        {savedMessage && (
  <div className="saved-message">
    ✓ {savedMessage}
  </div>
)}

      </main>
    </div>
  );

}
export default Dashboard;