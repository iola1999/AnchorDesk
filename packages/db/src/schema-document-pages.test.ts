import { describe, expect, test } from "vitest";

import { documentPages } from "./schema";

describe("documentPages schema", () => {
  test("stores PDF page dimensions as floating-point values", () => {
    expect(documentPages.width.getSQLType()).toBe("double precision");
    expect(documentPages.height.getSQLType()).toBe("double precision");
  });
});
