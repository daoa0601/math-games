import { describe, expect, it } from "vitest";

import { fractionBuilderTranslations } from "../translations";

describe("fractionBuilderTranslations en/vi parity", () => {
  it("has the same key set in both locales", () => {
    const en = Object.keys(fractionBuilderTranslations.en).sort();
    const vi = Object.keys(fractionBuilderTranslations.vi).sort();
    expect(vi).toEqual(en);
  });

  it("provides every misconception feedback key in both locales", () => {
    const feedbackKeys = Object.keys(fractionBuilderTranslations.en).filter(
      (k) => k.startsWith("fb.feedback."),
    );
    expect(feedbackKeys.length).toBeGreaterThan(0);
    for (const key of feedbackKeys) {
      expect(fractionBuilderTranslations.vi).toHaveProperty(key);
    }
  });
});
