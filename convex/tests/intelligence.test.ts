import { describe, expect, it, vi } from "vitest";
import { AgentServiceError, extractOpportunity } from "../ai";
import { researchCompany } from "../research";

const validExtraction = {
  companyName: "Acme",
  industry: null,
  eventType: "New warehouse",
  location: null,
  eventDate: null,
  signals: ["new_warehouse"],
  evidence: [
    {
      text: "Acme opened a warehouse",
      signal: "new_warehouse",
      citationIndex: null,
    },
  ],
  citations: [],
  recommendedSolution: "WMS",
  reasoning: "The cited opening creates an implementation need.",
  recommendedContactRole: "Head of Operations",
  nextAction: "Confirm the launch timeline.",
  linkedinMessage: "I saw the warehouse announcement.",
  emailOpener: "Your warehouse announcement stood out.",
  confidence: 0.9,
};

describe("extractOpportunity", () => {
  it("repairs malformed model JSON once", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ choices: [{ message: { content: "not-json" } }] }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [
              { message: { content: JSON.stringify(validExtraction) } },
            ],
          }),
        ),
      );
    await expect(
      extractOpportunity(
        {
          sellerSolution: "WMS",
          sourceText: "Acme opened a warehouse",
          researchWithLinkUp: false,
        },
        [],
        { apiKey: "test", model: "test-model", fetcher },
      ),
    ).resolves.toMatchObject({
      companyName: "Acme",
      eventType: null,
      signals: ["new_warehouse"],
      reasoning: expect.stringContaining("Acme opened a warehouse"),
      linkedinMessage: expect.not.stringContaining("implementation need"),
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("maps provider failures to a stable AI_FAILED code", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("down", { status: 503 }));
    await expect(
      extractOpportunity(
        {
          sellerSolution: "WMS",
          sourceText: "source",
          researchWithLinkUp: false,
        },
        [],
        { apiKey: "test", model: "test-model", fetcher },
      ),
    ).rejects.toMatchObject({
      code: "AI_FAILED",
    } satisfies Partial<AgentServiceError>);
  });
  it("rejects citations that were not supplied by research", async () => {
    const invented = {
      ...validExtraction,
      evidence: [{ ...validExtraction.evidence[0], citationIndex: 0 }],
      citations: [
        {
          url: "https://invented.example/news",
          title: "Invented",
          publishedAt: null,
        },
      ],
    };
    const payload = JSON.stringify({
      choices: [{ message: { content: JSON.stringify(invented) } }],
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(payload))
      .mockResolvedValueOnce(new Response(payload));
    await expect(
      extractOpportunity(
        {
          sellerSolution: "WMS",
          sourceText: "Acme opened a warehouse",
          researchWithLinkUp: false,
        },
        [],
        { apiKey: "test", model: "test-model", fetcher },
      ),
    ).rejects.toMatchObject({ code: "INVALID_AI_OUTPUT" });
  });

  it("uses the authoritative LinkUp source list for evidence indexes", async () => {
    const research = [
      {
        url: "https://example.com/first",
        title: "First source",
        publishedAt: null,
        snippet: "Acme discussed its retail strategy.",
      },
      {
        url: "https://example.com/warehouse",
        title: "Warehouse source",
        publishedAt: "2026-07-01",
        snippet: "Acme opened a warehouse in Bengaluru.",
      },
    ];
    const extraction = {
      ...validExtraction,
      evidence: [
        {
          text: "Acme opened a warehouse in Bengaluru.",
          signal: "new_warehouse",
          citationIndex: 1,
        },
      ],
      // Models sometimes return only used citations even though evidence
      // indexes refer to the numbered researchSources input.
      citations: [research[0]],
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(extraction) } }],
        }),
      ),
    );

    await expect(
      extractOpportunity(
        {
          sellerSolution: "Warehouse Management System",
          companyName: "Acme",
          researchWithLinkUp: true,
        },
        research,
        { apiKey: "test", model: "test-model", fetcher },
      ),
    ).resolves.toMatchObject({
      citations: [
        { url: "https://example.com/first" },
        { url: "https://example.com/warehouse" },
      ],
      evidence: [{ citationIndex: 1 }],
    });
  });

  it("nulls unsupported facts and replaces model-authored narratives", async () => {
    const invented = {
      ...validExtraction,
      companyName: "Invented Holdings",
      industry: "Aerospace",
      location: "Moon Base Alpha",
      eventDate: "2099-01-01",
      reasoning: "Invented Holdings has signed a secret purchase order.",
      linkedinMessage: "Congrats on the secret Mars contract.",
      emailOpener: "Your unannounced acquisition stood out.",
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(invented) } }],
        }),
      ),
    );
    const result = await extractOpportunity(
      {
        sellerSolution: "Warehouse Management System",
        sourceText: "Acme opened a warehouse",
        researchWithLinkUp: false,
      },
      [],
      { apiKey: ["te", "st"].join(""), model: "test-model", fetcher },
    );
    expect(result).toMatchObject({
      companyName: null,
      industry: null,
      location: null,
      eventDate: null,
    });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("Mars");
  });
});

describe("researchCompany", () => {
  it("does not call LinkUp for pasted text without a company or URL", async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(
      researchCompany(
        {
          sellerSolution: "WMS",
          sourceText: "Acme announced a warehouse.",
          researchWithLinkUp: true,
        },
        { apiKey: "test", fetcher },
      ),
    ).resolves.toEqual([]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("normalizes LinkUp sources and snippets", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              url: "https://example.com/acme",
              name: "Acme expansion",
              content: "  Acme announced a new warehouse.  ",
              publishedAt: "2026-07-01",
            },
          ],
        }),
      ),
    );
    await expect(
      researchCompany(
        {
          sellerSolution: "WMS",
          companyName: "Acme",
          researchWithLinkUp: true,
        },
        { apiKey: "test", fetcher },
      ),
    ).resolves.toEqual([
      {
        url: "https://example.com/acme",
        title: "Acme expansion",
        publishedAt: "2026-07-01",
        snippet: "Acme announced a new warehouse.",
      },
    ]);
  });

  it("returns RESEARCH_FAILED on timeout", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException("aborted", "AbortError"));
    await expect(
      researchCompany(
        {
          sellerSolution: "WMS",
          companyName: "Acme",
          researchWithLinkUp: true,
        },
        { apiKey: "test", fetcher },
      ),
    ).rejects.toMatchObject({ code: "RESEARCH_FAILED", recoverable: true });
  });
});
