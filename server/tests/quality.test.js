import { chunkText } from "../src/services/embeddings/chunkText.js";
import { scoreResponse } from "../src/services/evaluation/scoreResponse.js";
import { compareGrounding } from "../src/services/evaluation/compareGrounding.js";
import { rankChunks, tokenize } from "../src/services/vector/retrievalScoring.js";
import { parseAnalysisSections } from "../src/services/parser/parseAnalysisSections.js";

describe("repository text chunking", () => {
  test("keeps the configured overlap between adjacent chunks", () => {
    const chunks = chunkText("abcdefghijklmnopqrst", 8, 2);

    expect(chunks).toEqual(["abcdefgh", "ghijklmn", "mnopqrst", "st"]);
    expect(chunks[0].slice(-2)).toBe(chunks[1].slice(0, 2));
    expect(chunks[1].slice(-2)).toBe(chunks[2].slice(0, 2));
  });
});

describe("hybrid repository retrieval", () => {
  const chunk = (filePath, chunkText, vector, terms, pathTerms) => ({
    filePath,
    chunkText,
    module: "source",
    vector: Float32Array.from(vector),
    terms: new Set(terms),
    pathTerms: new Set(pathTerms),
  });

  test("uses repository path matches to improve semantic ranking", () => {
    const candidates = [
      chunk("src/common.js", "unrelated", [0.99, 0.01], ["common"], ["common"]),
      chunk("src/auth/session.js", "session handler", [0.8, 0.2], ["session", "handler"], ["auth", "session"]),
    ];

    const results = rankChunks([1, 0], candidates, "authentication session", 2);

    expect(results[0].chunk.metadata.filePath).toBe("src/auth/session.js");
  });

  test("limits repeated chunks from one file and splits camel case terms", () => {
    const candidates = [
      chunk("src/auth.js", "one", [1, 0], ["auth"], ["auth"]),
      chunk("src/auth.js", "two", [0.99, 0.01], ["auth"], ["auth"]),
      chunk("src/auth.js", "three", [0.98, 0.02], ["auth"], ["auth"]),
      chunk("src/session.js", "four", [0.8, 0.2], ["session"], ["session"]),
    ];

    const results = rankChunks([1, 0], candidates, "auth session", 4);

    expect(results.filter((item) => item.chunk.metadata.filePath === "src/auth.js")).toHaveLength(2);
    expect(tokenize("userAuthController.js")).toEqual(new Set(["user", "auth", "controller"]));
  });
});

describe("answer quality and source grounding", () => {
  test("marks processing failures and insufficient evidence as failed", () => {
    expect(scoreResponse({ answer: "Failed to generate response" }).score).toBe(0);
    expect(scoreResponse({ answer: "I could not find enough repository evidence." }).passed).toBe(false);
  });

  test("passes a detailed answer that cites a repository file", () => {
    const result = scoreResponse({
      question: "Where is authentication handled?",
      answer: "Authentication is handled by the session middleware and login route. See `server/src/routes/auth.routes.js`. The route validates the credentials, creates the session, and returns the authenticated user to the client.",
    });

    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(55);
  });

  test("only counts cited source paths as grounded", () => {
    const result = compareGrounding({
      answer: "The handler is implemented in `src/chat.js`.",
      sources: ["src/chat.js", "src/auth.js"],
    });

    expect(result.groundedFiles).toEqual(["src/chat.js"]);
    expect(result.groundingScore).toBe(50);
  });
});

describe("repository analysis sections", () => {
  test("separates architecture, critical paths, and onboarding from one model response", () => {
    const result = parseAnalysisSections(
      "## Architecture\nA React client and Express server.\n\n## Critical Execution Paths\nRoutes call services and MongoDB models.\n\n## Developer Onboarding\nStart at `server/src/server.js`.",
    );

    expect(result.architectureSummary).toBe("A React client and Express server.");
    expect(result.criticalPathAnalysis).toBe("Routes call services and MongoDB models.");
    expect(result.onboardingGuide).toBe("Start at `server/src/server.js`.");
  });
});
