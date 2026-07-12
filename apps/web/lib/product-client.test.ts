import { describe, expect, it } from "vitest";
import {
  analyticsMutationArgs,
  createConvexProductClient,
  createFixtureProductClient,
} from "./product-client";

describe("ProductClient selection adapters", () => {
  it("exposes fixture and Convex modes explicitly", () => {
    expect(createFixtureProductClient().mode).toBe("fixture");
    expect(createConvexProductClient("https://example.convex.cloud").mode).toBe(
      "convex",
    );
  });
});

describe("analyticsMutationArgs", () => {
  it("maps the client event name to the backend contract", () => {
    expect(
      analyticsMutationArgs(
        {
          event: "generation_failed",
          visitorId: "local-id",
          properties: { code: "INVALID_AI_OUTPUT" },
        },
        "server-id",
      ),
    ).toEqual({
      name: "generation_failed",
      visitorId: "server-id",
      properties: { code: "INVALID_AI_OUTPUT" },
    });
  });
});
