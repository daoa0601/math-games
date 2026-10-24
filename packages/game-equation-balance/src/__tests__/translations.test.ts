import { describe, expect, it } from "vitest";

import { equationBalanceTranslations } from "../translations";

describe("equationBalanceTranslations en/vi parity", () => {
  it("has the same key set in both locales", () => {
    const en = Object.keys(equationBalanceTranslations.en).sort();
    const vi = Object.keys(equationBalanceTranslations.vi).sort();
    expect(vi).toEqual(en);
  });

  it("provides every misconception feedback key in both locales", () => {
    const feedbackKeys = Object.keys(equationBalanceTranslations.en).filter(
      (k) => k.startsWith("eb.feedback."),
    );
    expect(feedbackKeys.length).toBeGreaterThan(0);
    for (const key of feedbackKeys) {
      expect(equationBalanceTranslations.vi).toHaveProperty(key);
    }
  });
});
