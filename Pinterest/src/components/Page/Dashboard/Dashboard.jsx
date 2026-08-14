import "./Dashboard.css";
import ResourceCard from "../../ResourceCard/ResourceCard";
import { useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

const VIDEO_CACHE_KEY = "pinlearn_video_cache_v1";
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
    // Ignore quota/storage errors and continue without persistent cache.
  }
}

function resourceKey(resource) {
  return resource?.id || resource?.url || resource?.title;
}

const RESOURCES = [
  {
    id: 1,
    topic: "React",
    type: "Video",
    title: "React Hooks Explained",
    description: "Learn the basics of React Hooks.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 2,
    topic: "React",
    type: "Article",
    title: "Understanding React Components",
    description: "A beginner-friendly guide to React components.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 3,
    topic: "React",
    type: "Repository",
    title: "React Projects",
    description: "Explore projects built using React.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 4,
    topic: "React",
    type: "Project",
    title: "React Dashboard",
    description: "A dashboard project built with React.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 5,
    topic: "AI",
    type: "Video",
    title: "Introduction to AI",
    description: "Understand the basics of Artificial Intelligence.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 6,
    topic: "AI",
    type: "Article",
    title: "How AI Works",
    description: "An introduction to modern AI concepts.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 7,
    topic: "AI",
    type: "Repository",
    title: "Awesome AI Projects",
    description: "Explore interesting AI projects.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 8,
    topic: "Playwright",
    type: "Video",
    title: "Playwright Basics",
    description: "Get started with Playwright testing.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 9,
    topic: "Playwright",
    type: "Article",
    title: "Understanding Playwright Fixtures",
    description: "Learn about reusable Playwright fixtures.",
    image: "https://placehold.co/600x400"
  },
  {
    id: 10,
    topic: "Playwright",
    type: "Repository",
    title: "Playwright Examples",
    description: "Explore Playwright automation examples.",
    image: "https://placehold.co/600x400"
  }
];

function Dashboard({ boards = [], setBoards = () => {} }) {
  const routerData = useLocation();
  const selectedInterests = useMemo(() => {
    return routerData.state?.selectedInterests ?? [];
  }, [routerData.state]);
  const [savedResources, setSavedResources] = useState([]);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [resourceToSave, setResourceToSave] = useState(null);
const [savedMessage,setSavedMessage]=useState("");
const [videosByInterest, setVideosByInterest] = useState({});

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

  const createBoard = () => {
    const trimmedBoardName = newBoardName.trim();
    if (!trimmedBoardName) {
      return;
    }

    const existingBoard = boards.find(
      (board) => board.name.toLowerCase() === trimmedBoardName.toLowerCase()
    );

    if (existingBoard) {
      saveToBoard(existingBoard.id);
      return;
    }

    const newBoard = {
      id: Date.now(),
      name: trimmedBoardName,
      resources: resourceToSave ? [resourceToSave] : []
    };

    setBoards((previousBoards) => [...previousBoards, newBoard]);

    if (resourceToSave) {
      setSavedResources((previousSaved) => {
        const keyToSave = resourceKey(resourceToSave);
        if (previousSaved.some((resource) => resourceKey(resource) === keyToSave)) {
          return previousSaved;
        }
        return [...previousSaved, resourceToSave];
      });
      setSavedMessage(`Saved to "${trimmedBoardName}"`);
      setTimeout(() => {
        setSavedMessage("");
      }, 2500);
    }

    setNewBoardName("");
    setShowCreateBoard(false);
    setShowBoardSelector(false);
    setResourceToSave(null);
  };

  const interestsToRender = useMemo(() => {
    return selectedInterests.length
      ? selectedInterests
      : [...new Set(RESOURCES.map((resource) => resource.topic))];
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
            const response = await fetch(
              `http://localhost:5000/api/youtube?topic=${encodeURIComponent(interest)}`
            );
            const data = await response.json();
            return [interest, Array.isArray(data) ? data : []];
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

  const openBoardSelector = (resource) => {
    setResourceToSave(resource);
    setShowCreateBoard(false);
    setNewBoardName("");
    setShowBoardSelector(true);
  };

  const saveToBoard = (boardId) => {
  const selectedBoard = boards.find(
    (board) => board.id === boardId
  );

  if (!selectedBoard || !resourceToSave) {
    return;
  }

  const alreadySaved = selectedBoard.resources.some(
    (resource) => resource.id === resourceToSave.id
  );

  if (alreadySaved) {
    setShowBoardSelector(false);

    setSavedMessage(
      `Already saved to "${selectedBoard.name}"`
    );

    setTimeout(() => {
      setSavedMessage("");
    }, 2500);

    return;
  }

  setBoards((previousBoards) => {
    return previousBoards.map((board) => {
      if (board.id === boardId) {
        return {
          ...board,
          resources: [
            ...board.resources,
            resourceToSave
          ]
        };
      }

      return board;
    });
  });

  setShowBoardSelector(false);
  setResourceToSave(null);

  setSavedResources((previousSaved) => {
    const keyToSave = resourceKey(resourceToSave);
    if (previousSaved.some((resource) => resourceKey(resource) === keyToSave)) {
      return previousSaved;
    }
    return [...previousSaved, resourceToSave];
  });

  setSavedMessage(
    `Saved to "${selectedBoard.name}"`
  );

  setTimeout(() => {
    setSavedMessage("");
  }, 2500);
};

  return (
    <div className="dashboard">
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

              {repositories.length > 0 && (
                <>
                  <h3>Repositories</h3>

                  <div className="content-grid">

                    {repositories.map((resource) => (
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
                  key={board.id}
                  onClick={() => saveToBoard(board.id)}
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

            {showCreateBoard && (
              <div className="create-board-form">

                <input
                  type="text"
                  placeholder="Enter board name"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                />

                <button onClick={createBoard}>
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