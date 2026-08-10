import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./components/Page/Auth/Auth";
import Interests from "./components/Page/Interests/Interests";
import Dashboard from "./components/Page/Dashboard/Dashboard";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Auth />} />

        <Route path="/interests" element={<Interests />} />
        <Route path="/dashboard" element={<Dashboard/>}/>
      </Routes>

    </BrowserRouter>
  );
}

export default App;