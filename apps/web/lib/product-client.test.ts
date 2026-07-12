import { describe, expect, it } from "vitest";
import { createConvexProductClient, createFixtureProductClient } from "./product-client";

describe("ProductClient selection adapters", () => {
  it("exposes fixture and Convex modes explicitly", () => {
    expect(createFixtureProductClient().mode).toBe("fixture");
    expect(createConvexProductClient("https://example.convex.cloud").mode).toBe("convex");
  });
});
