import EvaluationModel from "../../models/Evaluation.model.js";
import { scoreResponse } from "./scoreResponse.js";
import { compareGrounding } from "./compareGrounding.js";
import { repoAgent } from "../agents/repoAgent.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export const evaluateAndStore = async ({
  repositoryId,
  question,
  answer,
  sources = [],
}) => {
  const responseEval = scoreResponse({ question, answer });
  const groundingEval = compareGrounding({ answer, sources });

  const weightedScore = Math.round(
    responseEval.score * 0.7 + groundingEval.groundingScore * 0.3,
  );
  const passed = weightedScore >= 60;

  await EvaluationModel.create({
    repositoryId,
    testQuestion: question,
    expectedAnswer: "Grounded, relevant, and readable repository answer",
    actualAnswer: answer,
    groundedFiles: groundingEval.groundedFiles,
    score: weightedScore,
    passed,
  });

  return {
    score: weightedScore,
    passed,
    groundingScore: groundingEval.groundingScore,
  };
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stopWords = new Set([
  "the", "and", "for", "from", "with", "this", "that", "should", "describe",
  "point", "list", "mention", "explain", "concrete", "important", "relevant",
  "grounded", "indexed", "data", "when", "possible", "repository", "repo",
]);

const normalizeWord = (word) => {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && word.length > 3) return word.slice(0, -1);
  return word;
};

const tokenSet = (text = "") =>
  new Set(
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word))
      .map(normalizeWord),
  );

const computeExpectationScore = (expected = "", actual = "") => {
  const exp = tokenSet(expected);
  const act = tokenSet(actual);
  if (!exp.size) return 0;

  let overlap = 0;
  for (const word of exp) {
    if (act.has(word)) overlap += 1;
  }
  return Math.round((overlap / exp.size) * 100);
};

export const runGoldenDatasetEvaluation = async (repositoryId) => {
  const datasetPath = path.join(__dirname, "goldenDataset.json");
  const raw = await fs.readFile(datasetPath, "utf-8");
  const dataset = JSON.parse(raw);

  if (!Array.isArray(dataset) || dataset.length === 0) {
    return {
      total: 0,
      passed: 0,
      avgScore: 0,
      results: [],
      message: "No golden dataset records found.",
    };
  }

  const results = [];

  for (const item of dataset) {
    const question = item?.question || "";
    const expectedAnswer = item?.expectedAnswer || "";

    const response = await repoAgent(repositoryId, question, []);
    const actualAnswer = response?.answer || "";
    const sources = response?.sources || [];

    const responseEval = scoreResponse({ question, answer: actualAnswer });
    const groundingEval = compareGrounding({ answer: actualAnswer, sources });
    const expectationScore = computeExpectationScore(expectedAnswer, actualAnswer);

    const finalScore = Math.round(
      responseEval.score * 0.5 + groundingEval.groundingScore * 0.3 + expectationScore * 0.2,
    );
    const passed = finalScore >= 60;

    const doc = await EvaluationModel.create({
      repositoryId,
      testQuestion: question,
      expectedAnswer,
      actualAnswer,
      groundedFiles: groundingEval.groundedFiles,
      score: finalScore,
      passed,
    });

    results.push({
      id: doc._id,
      question,
      score: finalScore,
      passed,
      groundingScore: groundingEval.groundingScore,
      expectationScore,
    });
  }

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const avgScore = total
    ? Number((results.reduce((sum, r) => sum + r.score, 0) / total).toFixed(2))
    : 0;

  return {
    total,
    passed,
    passRate: total ? Number(((passed / total) * 100).toFixed(2)) : 0,
    avgScore,
    results,
  };
};
