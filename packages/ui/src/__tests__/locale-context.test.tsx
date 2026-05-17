import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, beforeEach } from "vitest";

import { LocaleProvider, useLocale } from "../locale-context";
import type { TranslationDict } from "../locale-context";

const translations: TranslationDict = {
  en: {
    greeting: "Hello",
    farewell: "Goodbye",
  },
  vi: {
    greeting: "Xin chao",
    farewell: "Tam biet",
  },
};

function LocaleDisplay() {
  const { locale, setLocale, t, tx } = useLocale();

  return (
    <div>
      <p data-testid="locale">{locale}</p>
      <p data-testid="greeting">{t("greeting")}</p>
      <p data-testid="missing">{t("nonexistent.key")}</p>
      <p data-testid="fallback">{tx("nonexistent.key", "Fallback text")}</p>
      <button onClick={() => setLocale("vi")}>Switch to Vietnamese</button>
      <button onClick={() => setLocale("en")}>Switch to English</button>
    </div>
  );
}

describe("LocaleProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "";
  });

  test("provides English locale and translations by default", () => {
    render(
      <LocaleProvider translations={translations}>
        <LocaleDisplay />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("greeting")).toHaveTextContent("Hello");
  });

  test("t() returns the key when no translation exists", () => {
    render(
      <LocaleProvider translations={translations}>
        <LocaleDisplay />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("missing")).toHaveTextContent("nonexistent.key");
  });

  test("tx() returns the fallback when no translation exists", () => {
    render(
      <LocaleProvider translations={translations}>
        <LocaleDisplay />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("fallback")).toHaveTextContent("Fallback text");
  });

  test("setLocale switches to Vietnamese and updates translations", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider translations={translations}>
        <LocaleDisplay />
      </LocaleProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Switch to Vietnamese" }),
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("vi");
    expect(screen.getByTestId("greeting")).toHaveTextContent("Xin chao");
  });

  test("setLocale persists the choice to localStorage", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider translations={translations}>
        <LocaleDisplay />
      </LocaleProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Switch to Vietnamese" }),
    );

    expect(localStorage.getItem("mg-locale")).toBe("vi");
  });

  test("sets document.documentElement.lang when locale changes", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider translations={translations}>
        <LocaleDisplay />
      </LocaleProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Switch to Vietnamese" }),
    );

    expect(document.documentElement.lang).toBe("vi");
  });

  test("restores saved locale from localStorage on mount", () => {
    localStorage.setItem("mg-locale", "vi");
    render(
      <LocaleProvider translations={translations}>
        <LocaleDisplay />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("vi");
    expect(screen.getByTestId("greeting")).toHaveTextContent("Xin chao");
  });

  test("switching back to English updates translations correctly", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider translations={translations}>
        <LocaleDisplay />
      </LocaleProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "Switch to Vietnamese" }),
    );
    expect(screen.getByTestId("greeting")).toHaveTextContent("Xin chao");

    await user.click(screen.getByRole("button", { name: "Switch to English" }));
    expect(screen.getByTestId("greeting")).toHaveTextContent("Hello");
  });
});
