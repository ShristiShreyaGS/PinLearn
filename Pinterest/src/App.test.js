import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import themeReducer from "./store/themeSlice";
import App from "./App";

function renderApp(path) {
  window.history.pushState({}, "", path);
  const store = configureStore({ reducer: { theme: themeReducer } });
  return render(
    <Provider store={store}>
      <App />
    </Provider>
  );
}

beforeEach(() => sessionStorage.clear());

test("renders the login page at /", () => {
  renderApp("/");
  expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
});

test.each(["/dashboard", "/boards", "/kanban", "/quiz", "/profile"])(
  "redirects unauthenticated visitors from %s to login",
  (path) => {
    renderApp(path);
    expect(window.location.pathname).toBe("/");
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  }
);

test("shows a 404 page for unknown routes", () => {
  renderApp("/definitely-not-a-page");
  expect(screen.getByRole("heading", { name: /page not found/i })).toBeInTheDocument();
});

test("marks the current section in the navbar and exposes a skip link when signed in", () => {
  sessionStorage.setItem("token", "t");
  global.fetch = jest.fn(() => new Promise(() => {}));
  renderApp("/boards");
  expect(screen.getByRole("link", { name: /skip to content/i })).toHaveAttribute("href", "#main-content");
  expect(screen.getByRole("link", { name: "My Boards" })).toHaveAttribute("aria-current", "page");
  expect(document.title).toBe("My Boards | PinLearn");
});
