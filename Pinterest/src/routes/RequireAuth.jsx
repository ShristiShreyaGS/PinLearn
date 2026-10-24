import { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { SESSION_EXPIRED_EVENT } from "../api/client";

export const hasSession = () => Boolean(sessionStorage.getItem("token"));

// Guards a route subtree and bounces to login when the session is missing or expires mid-use.
export default function RequireAuth() {
  const navigate = useNavigate();

  useEffect(() => {
    const onExpired = () => navigate("/", { replace: true });
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [navigate]);

  return hasSession() ? <Outlet /> : <Navigate to="/" replace />;
}
