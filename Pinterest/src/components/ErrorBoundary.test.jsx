import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

function Boom() {
  throw new Error("boom");
}

test("renders a fallback instead of a blank screen when a child throws", () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});

  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>
  );

  expect(screen.getByRole("alert")).toHaveTextContent(/something went wrong/i);
  spy.mockRestore();
});

test("renders children when nothing fails", () => {
  render(
    <ErrorBoundary>
      <p>ok</p>
    </ErrorBoundary>
  );

  expect(screen.getByText("ok")).toBeInTheDocument();
});
