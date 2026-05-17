import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, beforeEach } from "vitest";

import { ThemeToggle } from "../theme-toggle";
import { renderWithLocale } from "./test-utils";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  test("starts in light mode with aria-label indicating switch to dark", () => {
    renderWithLocale(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    ).toBeInTheDocument();
  });

  test("clicking toggles to dark mode and updates the aria-label", async () => {
    const user = userEvent.setup();
    renderWithLocale(<ThemeToggle />);

    const button = screen.getByRole("button", { name: "Switch to dark mode" });
    await user.click(button);

    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("clicking twice returns to light mode", async () => {
    const user = userEvent.setup();
    renderWithLocale(<ThemeToggle />);

    const button = screen.getByRole("button", { name: "Switch to dark mode" });
    await user.click(button);
    await user.click(
      screen.getByRole("button", { name: "Switch to light mode" }),
    );

    expect(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    ).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  test("persists theme choice to localStorage", async () => {
    const user = userEvent.setup();
    renderWithLocale(<ThemeToggle />);

    await user.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );

    expect(localStorage.getItem("mg-theme")).toBe("dark");
  });

  test("restores dark theme from localStorage on mount", () => {
    localStorage.setItem("mg-theme", "dark");
    renderWithLocale(<ThemeToggle />);

    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toBeInTheDocument();
  });
});
