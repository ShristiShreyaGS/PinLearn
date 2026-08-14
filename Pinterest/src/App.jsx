import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Auth from "./components/Page/Auth/Auth";
import Interests from "./components/Page/Interests/Interests";
import Dashboard from "./components/Page/Dashboard/Dashboard";
import Boards from "./components/Page/Boards/Boards";
import Kanban from "./components/Page/Kanban/Kanban";
import Navbar from "./components/Navbar/Navbar";

const DEFAULT_BOARDS = [
  {
    id: 1,
    name: "React Learning",
    resources: []
  },
  {
    id: 2,
    name: "AI Resources",
    resources: []
  },
  {
    id: 3,
    name: "Interview Prep",
    resources: []
  }
];

function readBoards() {
  try {
    const stored = localStorage.getItem("pinlearn_boards_v1");
    if (!stored) {
      return DEFAULT_BOARDS;
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return DEFAULT_BOARDS;
    }

    return parsed.map((board) => ({
      ...board,
      resources: Array.isArray(board.resources) ? board.resources : []
    }));
  } catch {
    return DEFAULT_BOARDS;
  }
}

function App() {
  const [boards, setBoards] = useState(readBoards);

  useEffect(() => {
    localStorage.setItem("pinlearn_boards_v1", JSON.stringify(boards));
  }, [boards]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/interests" element={<Interests />} />
        <Route
          path="/dashboard"
          element={
            <>
              <Navbar />
              <Dashboard boards={boards} setBoards={setBoards} />
            </>
          }
        />
        <Route
          path="/boards"
          element={
            <>
              <Navbar />
              <Boards boards={boards} />
            </>
          }
        />
        <Route
          path="/kanban"
          element={
            <>
              <Navbar />
              <Kanban />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;