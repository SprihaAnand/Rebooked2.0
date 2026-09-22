import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

jest.mock("./auth/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

test("renders the public Rebooked landing page", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: /pass knowledge on/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /donate books/i })).toBeInTheDocument();
});
