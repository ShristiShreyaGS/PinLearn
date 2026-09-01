import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getProfile } from "../../../api/user";
import { fetchRepositoryPage, fetchVideoPage } from "../../../api/content";
import { fetchStreak, markActivity } from "../../../api/streak";
import StreakCalendar from "../../StreakCalendar/StreakCalendar";
import ResourceCard from "../../ResourceCard/ResourceCard";
import PageBackdrop from "../PageBackdrop";

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function generateCalendarFromStreak(streak = {}) {
  const map = {};
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(end);
    d.setDate(end.getDate() - (364 - i));
    map[formatDate(d)] = 0;
  }
  const current = Number(streak.current) || 0;
  for (let i = 0; i < current; i += 1) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    map[formatDate(d)] = 1;
  }
  return map;

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

const HOT_TOPICS = [
  "TypeScript",
  "Next.js",
  "Docker",
  "Kubernetes",
  "Cloud Computing",
  "Cybersecurity",
  "Machine Learning",
  "GraphQL"
];

const EXPLORE_TOPIC_BATCH_SIZE = 2;

function resourceKey(resource) {
  return resource?.id || resource?.url || resource?.title;
}

function Dashboard({
  boards = [],
  createBoard = async () => {},
  saveResourceToBoard = async () => {}
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const routeInterests = location.state?.selectedInterests || [];
  const [selectedInterests, setSelectedInterests] = useState(routeInterests);
  const [exploreResources, setExploreResources] = useState([]);
  const [exploreTopics, setExploreTopics] = useState([]);
  const [exploreCursors, setExploreCursors] = useState({});
  const [exploreLoading, setExploreLoading] = useState(false);
  const exploreLoadingRef = useRef(false);
  const [exploreError, setExploreError] = useState("");
  const [resourceToSave, setResourceToSave] = useState(null);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [boardError, setBoardError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [streak, setStreak] = useState({ current: 0, longest: 0, activeToday: false });
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    let isMounted = true;

    getProfile()
      .then((profile) => {
        if (!isMounted) return;
        if (Array.isArray(profile.selectedInterests)) {
          setSelectedInterests(profile.selectedInterests);
        }
        // profile may be the user object; prefer name field when available
        const nameFromResponse = profile?.name || profile?.user?.name;
        if (nameFromResponse) {
          setProfileName(nameFromResponse);
          try {
            localStorage.setItem("user", JSON.stringify(profile));
          } catch (e) {}
        }
      })
      .catch(() => {
        // fallback: try reading stored user from localStorage
        try {
          const stored = JSON.parse(localStorage.getItem("user") || "null");
          if (isMounted && stored?.name) setProfileName(stored.name);
          if (isMounted && Array.isArray(stored?.selectedInterests)) setSelectedInterests(stored.selectedInterests);
        } catch (error) {
          console.error("Failed to load current interests:", error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    fetchStreak()
      .then(setStreak)
      .catch((error) => console.error("Failed to load streak:", error));
  }, []);

  const interestsToRender = useMemo(
    () => selectedInterests.length ? selectedInterests : FALLBACK_INTERESTS,
    [selectedInterests]
  );

  const availableHotTopics = useMemo(() => {
    const selected = new Set(interestsToRender.map((interest) => interest.toLowerCase()));
    return HOT_TOPICS.filter((topic) => !selected.has(topic.toLowerCase()));
  }, [interestsToRender]);

  const loadExploreBatch = useCallback(async ({ reset = false } = {}) => {
    if (exploreLoadingRef.current) return;

    const topics = reset
      ? availableHotTopics.slice(0, EXPLORE_TOPIC_BATCH_SIZE)
      : [
          ...exploreTopics,
          ...availableHotTopics.slice(exploreTopics.length, exploreTopics.length + EXPLORE_TOPIC_BATCH_SIZE)
        ];
    const topicsToFetch = topics.filter((topic) => reset || !exploreTopics.includes(topic) || Object.keys(exploreCursors).some((key) => key.startsWith(`${topic}:`)));
    const requests = [];

    for (const topic of topicsToFetch) {
      const videoKey = `${topic}:videos`;
      const repositoryKey = `${topic}:repositories`;
      const videoCursor = reset && !exploreTopics.includes(topic) ? {} : exploreCursors[videoKey] || {};
      const repositoryCursor = reset && !exploreTopics.includes(topic) ? {} : exploreCursors[repositoryKey] || {};

      requests.push(
        fetchVideoPage(topic, { pageToken: videoCursor.nextPageToken || "" }).then((result) => ({
          key: videoKey,
          items: result.items,
          cursor: { nextPageToken: result.nextPageToken }
        })),
        fetchRepositoryPage(topic, { page: (repositoryCursor.page || 0) + 1 }).then((result) => ({
          key: repositoryKey,
          items: result.items,
          cursor: { page: (repositoryCursor.page || 0) + 1, hasNextPage: result.hasNextPage }
        }))
      );
    }

    if (!requests.length) return;
    setExploreLoading(true);
    exploreLoadingRef.current = true;
    setExploreError("");
    try {
      const results = await Promise.all(requests);
      const newResources = results.flatMap((result) => result.items);
      setExploreResources((previous) => {
        const seen = new Set(previous.map(resourceKey));
        return [...previous, ...newResources.filter((resource) => {
          const key = resourceKey(resource);
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        })];
      });
      setExploreTopics(topics);
      setExploreCursors((previous) => ({
        ...(reset ? {} : previous),
        ...Object.fromEntries(results.map((result) => [result.key, result.cursor]))
      }));
    } catch (error) {
      setExploreError("Explore resources could not be loaded right now.");
    } finally {
      exploreLoadingRef.current = false;
      setExploreLoading(false);
    }
  }, [exploreTopics, exploreCursors, availableHotTopics]);

  useEffect(() => {
    setExploreResources([]);
    setExploreTopics([]);
    setExploreCursors({});
    // call the loader when available topics change; avoid including the loader
    // function in deps to prevent it from being re-created and causing loops
    loadExploreBatch({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableHotTopics]);

  const canLoadMore = exploreTopics.length < availableHotTopics.length || Object.values(exploreCursors).some((cursor) => cursor.nextPageToken || cursor.hasNextPage);

  const openBoardSelector = (resource) => {
    setResourceToSave(resource);
    setShowBoardSelector(true);
    setShowCreateBoard(false);
    setBoardError("");
  };

  const showSaved = (message) => {
    // clear any existing timeout so messages don't overlap or leak after unmount
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }
    setSavedMessage(message);
    savedTimeoutRef.current = setTimeout(() => setSavedMessage(""), 2500);
  };

  const savedTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  // optimistic update: mark today as activity so calendar updates immediately
  const optimisticMarkToday = () => {
    const today = formatDate(new Date());
    setStreak((prev) => {
      const next = { ...prev };
      next.calendar = { ...(prev.calendar || {}) };
      next.calendar[today] = (next.calendar[today] || 0) + 1;
      // if activeToday wasn't set, update current streak and longest
      if (!prev.activeToday) {
        next.activeToday = true;
        next.current = (Number(prev.current) || 0) + 1;
        next.longest = Math.max(Number(next.longest) || 0, next.current);
      }
      return next;
    });
  };

  const saveToBoard = async (boardId) => {
    const board = boards.find((item) => item._id === boardId);
    if (!board || !resourceToSave) return;
    if ((board.resources || []).some((resource) => resourceKey(resource) === resourceKey(resourceToSave))) {
      setShowBoardSelector(false);
      showSaved(`Already saved to "${board.name}"`);
      return;
    }
    try {
      await saveResourceToBoard(boardId, resourceToSave);
      setShowBoardSelector(false);
      setResourceToSave(null);
      showSaved(`Saved to "${board.name}"`);
      // optimistic update so calendar UI reflects immediate change
      optimisticMarkToday();
      // notify backend of activity (creates a persisted record) and refresh streak
      markActivity().then(() => fetchStreak().then(setStreak)).catch(() => {});
    } catch (error) {
      setBoardError(error.message);
    }
  };

  const createBoardAndSave = async () => {
    const name = newBoardName.trim();
    if (!name||!resourceToSave) return;
    try {
      const board = await createBoard(name);
      await saveResourceToBoard(board._id, resourceToSave);
      setNewBoardName("");
      setShowCreateBoard(false);
      setShowBoardSelector(false);
      setResourceToSave(null);
      showSaved(`Saved to "${name}"`);
      optimisticMarkToday();
      markActivity().then(() => fetchStreak().then(setStreak)).catch(() => {});
    } catch (error) {
      setBoardError(error.message);
    }
  };

  const openTopic = (interest, source) => {
    navigate(`/topics/${encodeURIComponent(interest)}/${source}`);
  };

  return (
    <div className="relative isolate min-h-screen text-slate-800 dark:text-slate-200">
      <PageBackdrop className="pointer-events-none absolute inset-0 z-0 min-h-full" />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Hello {profileName ? profileName.split(" ")[0] : "there"}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
            Pick a video library or repository library for any of your selected topics.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2" aria-label="Selected interests">
          {interestsToRender.map((interest) => (
            <span
              className="rounded-full bg-gradient-to-r from-[#0b1736] to-[#1e3a8a] px-4 py-2 text-xs font-semibold text-white shadow-sm"
              key={interest}
            >
              {interest}
            </span>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '12px', alignItems: 'start' }}>
            {/* Left summary: compact */}
            <div style={{ paddingRight: 6 }}>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Learning streak</p>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-[36px] font-extrabold leading-none text-slate-900 dark:text-white">{streak.current}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Day Streak</div>
              </div>
              <div className="mt-2 text-sm text-slate-600">Best: <span className="font-semibold text-slate-900">{streak.longest} day{streak.longest === 1 ? '' : 's'}</span></div>
              <div className="mt-3">
                <button className="w-full rounded-md bg-gradient-to-r from-[#0b1736] to-[#1e3a8a] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95" type="button" onClick={() => { navigate('/quiz'); }}>
                  Take Today's Quiz
                </button>
              </div>
              <div className="mt-5">
                {(() => {
                  const milestones = [7, 30, 100];
                  const current = Number(streak.current) || 0;
                  const longest = Number(streak.longest) || 0;
                  const next = milestones.find((m) => m > longest) || milestones[milestones.length - 1];
                  const progress = Math.min(100, Math.round((current / next) * 100));
                  return (
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-500">Next milestone</div>
                        <div className="text-xs font-medium text-slate-900">{next}-day streak</div>
                      </div>
                      <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#60A5FA] to-[#1E3A8A] h-2" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{progress}% toward next milestone</div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Heatmap centered */}
            <div>
              <StreakCalendar activityMap={streak.calendar || generateCalendarFromStreak(streak)} onClickDay={() => navigate('/quiz')} compact={true} />
            </div>

            {/* Compact metrics row below spanning both columns */}
            <div style={{ gridColumn: '1 / span 2', marginTop: 10 }}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-slate-600">
                <div className="flex flex-col text-left">
                  <div className="text-xs text-slate-500">Resources</div>
                  <div className="font-semibold text-slate-900">{boards.length}</div>
                </div>
                <div className="flex flex-col text-left">
                  <div className="text-xs text-slate-500">Completed</div>
                  <div className="font-semibold text-slate-900">{Object.values(streak.calendar || {}).reduce((a,b)=>a+(b||0),0)}</div>
                </div>
                <div className="flex flex-col text-left">
                  <div className="text-xs text-slate-500">Learning Days</div>
                  <div className="font-semibold text-slate-900">{Object.values(streak.calendar || {}).filter(Boolean).length}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-10 space-y-9">
          {interestsToRender.map((interest) => (
            <section key={interest}>
              <h2 className="mb-3 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
                {interest}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <button
                  className="group grid min-h-[142px] gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-400"
                  type="button"
                  onClick={() => openTopic(interest, "videos")}
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
                    {interest} Videos
                  </span>
                  <strong className="text-xl font-bold text-slate-950 dark:text-white">Video library</strong>
                  
                </button>
                <button
                  className="group grid min-h-[142px] gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:border-blue-500 hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-400"
                  type="button"
                  onClick={() => openTopic(interest, "repositories")}
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
                    {interest} Repositories
                  </span>
                  <strong className="text-xl font-bold text-slate-950 dark:text-white">Repository library</strong>
                 
                </button>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-16 border-t border-slate-200 pt-10 dark:border-slate-800">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">Explore</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">Hot topics worth discovering</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">A mixed stream of videos and repositories beyond your selected topics.</p>
            </div>
          </div>

          {exploreError && <p className="mb-4 text-sm text-red-600">{exploreError}</p>}
          {exploreResources.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {exploreResources.map((resource) => (
                <ResourceCard
                  key={resourceKey(resource)}
                  resource={resource}
                  onSave={openBoardSelector}
                  isSaved={boards.some((board) => (board.resources || []).some((saved) => resourceKey(saved) === resourceKey(resource)))}
                />
              ))}
            </div>
          )}

          {canLoadMore && (
            <button
              className="mx-auto mt-8 block rounded-full bg-gradient-to-r from-[#0b1736] to-[#1e3a8a] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={exploreLoading}
              onClick={() => loadExploreBatch()}
            >
              {exploreLoading ? "Loading..." : "Load more"}
            </button>
          )}
        </section>

        {showBoardSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
            <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <button className="absolute right-4 top-3 text-2xl text-slate-500" type="button" onClick={() => setShowBoardSelector(false)}>×</button>
              <h3 className="mb-5 text-xl font-bold text-slate-950 dark:text-white">Save to Board</h3>
              {boards.length > 0 ? boards.map((board) => <button className="mb-2 block w-full rounded-lg bg-slate-100 px-4 py-3 text-left font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100" key={board._id} type="button" onClick={() => saveToBoard(board._id)}>{board.name}</button>) : <p className="mb-4 text-sm text-slate-500">No boards yet. Create one to save this resource.</p>}
              <button className="mt-2 w-full rounded-lg bg-slate-100 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100" type="button" onClick={() => setShowCreateBoard(true)}>+ Create New Board</button>
              {showCreateBoard && <div className="mt-4 flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-800 dark:text-white" value={newBoardName} autoFocus placeholder="Enter board name" onChange={(event) => setNewBoardName(event.target.value)} /><button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white" type="button" onClick={createBoardAndSave}>Create</button></div>}
              {boardError && <p className="mt-3 text-sm text-red-600">{boardError}</p>}
            </div>
          </div>
        )}
        {savedMessage && <div className="fixed right-4 top-20 z-50 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">{savedMessage}</div>}
      </main>
    </div>
  );
}

export default Dashboard;
