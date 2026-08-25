import "./Topic.css";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchRepositoryPage, fetchVideoPage } from "../../../api/content";
import ResourceCard from "../../ResourceCard/ResourceCard";
import PageBackdrop from "../PageBackdrop";

function resourceKey(resource) {
  return resource?.id || resource?.url || resource?.title;
}

function Topic({ boards = [], createBoard = async () => {}, saveResourceToBoard = async () => {}, refreshBoards }) {
  const { topic: encodedTopic, source } = useParams();
  const topic = decodeURIComponent(encodedTopic || "");
  const navigate = useNavigate();
  const isVideoPage = source === "videos";
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [requestToken, setRequestToken] = useState("");
  const [nextToken, setNextToken] = useState("");
  const [tokenHistory, setTokenHistory] = useState([]);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resourceToSave, setResourceToSave] = useState(null);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [boardError, setBoardError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  

  useEffect(() => {
    setPage(1);
    setRequestToken("");
    setNextToken("");
    setTokenHistory([]);
    
  }, [topic, source, search]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    const request = isVideoPage
      ? fetchVideoPage(topic, { pageToken: requestToken, search })
      : fetchRepositoryPage(topic, { page, search });

    request
      .then((result) => {
        if (!isMounted) return;
        setResources(result.items);
        setHasNextPage(isVideoPage ? Boolean(result.nextPageToken) : result.hasNextPage);
        if (isVideoPage) setNextToken(result.nextPageToken);
      })
      .catch(() => {
        if (isMounted) setError(`We could not load ${isVideoPage ? "videos" : "repositories"} right now.`);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [topic, source, page, requestToken, search, isVideoPage]);

  

  useEffect(() => {
    if (refreshBoards) refreshBoards();
  }, [refreshBoards]);

  const openBoardSelector = (resource) => {
    setResourceToSave(resource);
    setShowBoardSelector(true);
    setShowCreateBoard(false);
    setBoardError("");
  };

  const saveToBoard = async (boardId) => {
    const board = boards.find((item) => item._id === boardId);
    if (!board || !resourceToSave) return;
    if ((board.resources || []).some((resource) => resourceKey(resource) === resourceKey(resourceToSave))) {
      setSavedMessage(`Already saved to "${board.name}"`);
      setShowBoardSelector(false);
      return;
    }
    try {
      await saveResourceToBoard(boardId, resourceToSave);
      setSavedMessage(`Saved to "${board.name}"`);
      setShowBoardSelector(false);
      setResourceToSave(null);
    } catch (saveError) {
      setBoardError(saveError.message);
    }
  };

  const createBoardAndSave = async () => {
    const name = newBoardName.trim();
    if (!name || !resourceToSave) return;
    try {
      const board = await createBoard(name);
      await saveResourceToBoard(board._id, resourceToSave);
      setNewBoardName("");
      setShowCreateBoard(false);
      setShowBoardSelector(false);
      setResourceToSave(null);
      setSavedMessage(`Saved to "${name}"`);
    } catch (saveError) {
      setBoardError(saveError.message);
    }
  };

  useEffect(() => {
    if (!savedMessage) return undefined;
    const id = setTimeout(() => setSavedMessage(""), 2500);
    return () => clearTimeout(id);
  }, [savedMessage]);

  const goNext = () => {
    if (!hasNextPage || loading) return;
    if (isVideoPage) {
      setTokenHistory((history) => [...history, requestToken]);
      setRequestToken(nextToken);
    }
    setPage((current) => current + 1);
  };

  const goPrevious = () => {
    if (page === 1 || loading) return;
    if (isVideoPage) {
      const previousToken = tokenHistory[tokenHistory.length - 1] || "";
      setTokenHistory((history) => history.slice(0, -1));
      setRequestToken(previousToken);
    }
    setPage((current) => current - 1);
  };

  const heading = isVideoPage ? `${topic} Videos` : `${topic} Repositories`;

  return (
    <div className="topic-page relative isolate">
      <PageBackdrop className="pointer-events-none absolute inset-0 z-0 min-h-full" />
      <main className="topic-content">
        <button className="back-link" type="button" onClick={() => navigate("/dashboard")}>Back to dashboard</button>
        <p className="small-heading">{isVideoPage ? "VIDEO LIBRARY" : "REPOSITORY LIBRARY"}</p>
        <h1>{heading}</h1>
        <p className="topic-intro">Explore {isVideoPage ? "lessons and tutorials" : "open-source projects"} about {topic}.</p>

        <div className="topic-toolbar">
          <label htmlFor="topic-search">Search {isVideoPage ? "videos" : "repositories"}</label>
          <input
            id="topic-search"
            type="search"
            placeholder={isVideoPage ? "Search videos by title or channel" : "Search repositories by name or description"}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading && <p className="topic-status">Loading resources...</p>}
        {error && <p className="topic-status topic-error">{error}</p>}
        {!loading && !error && resources.length === 0 && <p className="topic-status">No resources found.</p>}
        {!loading && !error && resources.length > 0 && (
          <div className="content-grid">
            {resources.map((resource) => <ResourceCard key={resource.id} resource={resource} onSave={openBoardSelector} />)}
          </div>
        )}

        <nav className="topic-pagination" aria-label="Topic pages">
          <button type="button" disabled={page === 1 || loading} onClick={goPrevious}>Previous</button>
          <span>Page {page}</span>
          <button type="button" disabled={!hasNextPage || loading} onClick={goNext}>Next</button>
        </nav>

        {showBoardSelector && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
            <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <button className="absolute right-4 top-3 text-2xl text-slate-500" type="button" onClick={() => setShowBoardSelector(false)}>×</button>
              <h3 className="mb-4 text-xl font-bold text-slate-900 dark:text-white">Save to Board</h3>
              {boards.length > 0 ? (
                boards.map((board) => (
                  <button
                    key={board._id}
                    className="mb-2 block w-full rounded-lg bg-slate-100 px-4 py-3 text-left font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100"
                    type="button"
                    onClick={() => saveToBoard(board._id)}
                  >
                    {board.name}
                  </button>
                ))
              ) : (
                <p className="mb-4 text-sm text-slate-500">No boards yet. Create one to save this resource.</p>
              )}

              <button className="mt-2 w-full rounded-lg bg-slate-100 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100" type="button" onClick={() => setShowCreateBoard(true)}>+ Create New Board</button>

              {showCreateBoard && (
                <div className="mt-4 flex gap-2">
                  <input className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 dark:border-slate-600 dark:bg-slate-800 dark:text-white" value={newBoardName} autoFocus placeholder="Enter board name" onChange={(event) => setNewBoardName(event.target.value)} />
                  <button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white" type="button" onClick={createBoardAndSave}>Create</button>
                </div>
              )}

              {boardError && <p className="mt-3 text-sm text-red-600">{boardError}</p>}
            </div>
          </div>
        )}
        {savedMessage && (
          <div className="fixed right-4 top-20 z-50 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">{savedMessage}</div>
        )}
        
      </main>
    </div>
  );
}

export default Topic;
