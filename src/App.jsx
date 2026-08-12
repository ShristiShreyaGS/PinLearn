import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Auth from "./components/Page/Auth/Auth";
import Interests from "./components/Page/Interests/Interests";
import Dashboard from "./components/Page/Dashboard/Dashboard";
import Boards from "./components/Page/Boards/Boards";
import Navbar from "./components/Navbar/Navbar";

function App() {
  const [boards, setBoards] = useState([
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
  ]);

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;