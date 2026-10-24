import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import Auth from "./components/Page/Auth/Auth";
import Interests from "./components/Page/Interests/Interests";
import Profile from "./components/Page/Profile/Profile";
import Kanban from "./components/Page/Kanban/Kanban";
import Quiz from "./components/Page/Quiz/Quiz";
import ErrorBoundary from "./components/ErrorBoundary";
import useThemeClass from "./hooks/useThemeClass";
import usePageTitle from "./hooks/usePageTitle";
import NotFound from "./components/ui/NotFound";
import RequireAuth from "./routes/RequireAuth";
import AppLayout from "./routes/AppLayout";
import {
  DashboardRoute,
  TopicRoute,
  BoardsRoute,
  BoardDetailsRoute,
  ResourceDetailsRoute,
  LegacyTopicRedirect
} from "./routes/pageRoutes";

function RouteEffects() {
  usePageTitle();
  return null;
}

function App() {
  const mode = useSelector((state) => state.theme.mode);
  useThemeClass(mode);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <RouteEffects />
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/interests" element={<Interests />} />

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/topics/:topic/:source" element={<TopicRoute />} />
              <Route path="/topics/:topic" element={<LegacyTopicRedirect />} />
              <Route path="/boards" element={<BoardsRoute />} />
              <Route path="/boards/:boardId" element={<BoardDetailsRoute />} />
              <Route path="/boards/:boardId/resources/:resourceId" element={<ResourceDetailsRoute />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
