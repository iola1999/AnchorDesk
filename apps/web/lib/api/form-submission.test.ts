import { describe, expect, it, vi } from "vitest";

import { resetSubmittedForm } from "./form-submission";

describe("resetSubmittedForm", () => {
  it("skips reset when the captured form reference is missing", () => {
    expect(() => resetSubmittedForm(null)).not.toThrow();
    expect(() => resetSubmittedForm(undefined)).not.toThrow();
  });

  it("resets the captured form element after submit succeeds", () => {
    const form = {
      reset: vi.fn(),
    };

    resetSubmittedForm(form);

    expect(form.reset).toHaveBeenCalledTimes(1);
  });
});
