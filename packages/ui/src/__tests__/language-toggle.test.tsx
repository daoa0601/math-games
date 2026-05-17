import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, beforeEach } from "vitest";

import { LanguageToggle } from "../language-toggle";
import { renderWithLocale } from "./test-utils";

describe("LanguageToggle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('shows "VI" label in English locale indicating Vietnamese is the target', () => {
    renderWithLocale(<LanguageToggle />);

    expect(
      screen.getByRole("button", { name: "Switch to Vietnamese" }),
    ).toHaveTextContent("VI");
  });

  test('clicking switches to Vietnamese locale and shows "EN" label', async () => {
    const user = userEvent.setup();
    renderWithLocale(<LanguageToggle />);

    await user.click(
      screen.getByRole("button", { name: "Switch to Vietnamese" }),
    );

    const button = screen.getByRole("button", { name: /tiếng Anh/ });
    expect(button).toHaveTextContent("EN");
  });

  test("clicking twice returns to English locale", async () => {
    const user = userEvent.setup();
    renderWithLocale(<LanguageToggle />);

    await user.click(
      screen.getByRole("button", { name: "Switch to Vietnamese" }),
    );
    await user.click(screen.getByRole("button", { name: /tiếng Anh/ }));

    expect(
      screen.getByRole("button", { name: "Switch to Vietnamese" }),
    ).toHaveTextContent("VI");
  });

  test("persists locale choice to localStorage", async () => {
    const user = userEvent.setup();
    renderWithLocale(<LanguageToggle />);

    await user.click(
      screen.getByRole("button", { name: "Switch to Vietnamese" }),
    );

    expect(localStorage.getItem("mg-locale")).toBe("vi");
  });
});
