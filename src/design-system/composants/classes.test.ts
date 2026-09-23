import { describe, it, expect } from "vitest";
import { classes } from "./classes";

describe("classes", () => {
  it("joint les noms truthy et ignore false, null, undefined et les chaînes vides", () => {
    expect(classes("a", false, undefined, null, "", "b")).toBe("a b");
  });
});
