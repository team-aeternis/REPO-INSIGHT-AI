import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "react-toastify";
import { askRepoQuestion, submitRepo } from "../services/repoService";

const PHASES = [
  "Cloning Repository...",
  "Extracting Dependencies...",
  "Generating Embeddings...",
  "Analyzing Architecture...",
];

const SUGGESTIONS = [
  "Where is authentication handled?",
  "Explain repository architecture",
  "Where is database connected?",
  "What are important modules?",
  "Where should a new developer start?",
];

const toList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const cleanPath = (raw = "") => {
  if (typeof raw !== "string") {
    raw = raw?.filePath || raw?.file || "";
  }

  raw = raw.replace(/\\/g, "/");

  const serverIndex = raw.indexOf("server/");

  const clientIndex = raw.indexOf("client/");

  if (serverIndex !== -1) {
    return raw.slice(serverIndex);
  }

  if (clientIndex !== -1) {
    return raw.slice(clientIndex);
  }

  return raw;
};

const stringifyAnswer = (value) => {
  if (typeof value === "string") return value;
  if (value?.answer) return stringifyAnswer(value.answer);
  if (value == null) return "";
  return JSON.stringify(value, null, 2);
};

const summarizeStructuredDump = (value) => {
  const items = Array.isArray(value)
    ? value.slice(0, 5)
    : Object.entries(value || {})
        .slice(0, 6)
        .map(([key, val]) => ({
          key,
          value:
            typeof val === "string"
              ? val
              : Array.isArray(val)
                ? `${val.length} items`
                : val && typeof val === "object"
                  ? Object.keys(val).slice(0, 4).join(", ")
                  : String(val),
        }));

  const bullets = items
    .map((item) => {
      if (item?.key) return `- **${item.key}:** ${String(item.value).slice(0, 140)}`;
      if (typeof item === "string") return `- ${item.slice(0, 140)}`;
      return `- ${JSON.stringify(item).slice(0, 140)}`;
    })
    .join("\n");

  return `I received structured repository data instead of a polished answer. Here are the useful parts:\n\n${bullets}`;
};

const sanitizeAssistantAnswer = (value) => {
  const raw = stringifyAnswer(value).trim();
  if (!raw) return "No answer returned.";

  try {
    if (/^[{[]/.test(raw)) {
      return summarizeStructuredDump(JSON.parse(raw));
    }
  } catch {
    // Fall through to text cleanup when the response only looks like JSON.
  }

  const cleaned = raw
    .replace(/\r\n/g, "\n")
    .replace(/```(?:json)?\n[\s\S]{1200,}```/gi, "Large raw data omitted for readability.")
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return !/^(repository context|code chunk|file|provide|user question):?$/i.test(
        trimmed,
      );
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleaned.length <= 3600) return cleaned;

  const trimmed = cleaned.slice(0, 3400);
  const lastStop = Math.max(
    trimmed.lastIndexOf(". "),
    trimmed.lastIndexOf("\n- "),
    trimmed.lastIndexOf("\n\n"),
  );

  return `${trimmed.slice(0, lastStop > 2200 ? lastStop + 1 : 3400).trim()}\n\n_Response trimmed for readability. Ask for more detail on a specific file or flow._`;
};

const Markdown = ({ text, compact = false }) => (
  <div
    className={`max-w-none text-gray-800 ${
      compact ? "text-xs leading-5" : "text-[15px] leading-7"
    }`}
  >
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">
            {children}
          </ol>
        ),
        li: ({ children }) => <li className="pl-1">{children}</li>,
        code: ({ inline, children }) =>
          inline ? (
            <code className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[0.9em] text-gray-900">
              {children}
            </code>
          ) : (
            <code className="block overflow-x-auto whitespace-pre rounded-lg bg-gray-950 p-3 font-mono text-xs leading-5 text-gray-100">
              {children}
            </code>
          ),
        pre: ({ children }) => (
          <pre className="mb-3 max-h-72 overflow-auto rounded-lg last:mb-0">
            {children}
          </pre>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="bg-gray-50 px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-t border-gray-100 px-3 py-2 align-top">
            {children}
          </td>
        ),
      }}
    >
      {text || "No data available yet."}
    </ReactMarkdown>
  </div>
);

function InfoCard({ title, children, subtle = false }) {
  return (
    <section
      className={`mt-2 rounded-xl border p-4 ${
        subtle ? "border-gray-200 bg-white" : "border-gray-200 bg-gray-50"
      }`}
    >
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </section>
  );
}

function FilePills({ title, files, onCopy }) {
  const uniqueFiles = [...new Set(toList(files).map(cleanPath).filter(Boolean))];

  if (uniqueFiles.length === 0) return null;

  return (
    <details className="mt-3 rounded-xl border border-gray-200 bg-gray-50">
      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900">
        {title} ({uniqueFiles.length})
      </summary>
      <div className="flex flex-wrap gap-2 border-t border-gray-200 px-3 py-3">
        {uniqueFiles.map((file) => (
          <button
            key={file}
            type="button"
            onClick={() => onCopy(file)}
            title="Copy file path"
            className="max-w-full truncate rounded-full border border-gray-200 bg-white px-3 py-1.5 font-mono text-xs text-gray-700 hover:border-gray-300 hover:bg-gray-100"
          >
            {file}
          </button>
        ))}
      </div>
    </details>
  );
}

export default function ExplorePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!analyzing) return;
    const id = setInterval(() => {
      setPhaseIndex((v) => (v + 1) % PHASES.length);
    }, 1200);
    return () => clearInterval(id);
  }, [analyzing]);

  const repository = dashboard?.repository || {};
  const analysis = dashboard?.analysis || {};
  const modules = analysis?.modules || {};

  const entryPoints = useMemo(
    () =>
      toList(repository?.entryPoints)
        .map((entry) => ({
          file: cleanPath(
            typeof entry === "string" ? entry : entry?.file || "",
          ),
          framework: entry?.framework,
        }))
        .filter((entry) => entry.file),
    [repository?.entryPoints],
  );

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!repoUrl.trim() || analyzing) return;

    setAnalyzing(true);
    setPhaseIndex(0);
    const response = await submitRepo({ url: repoUrl.trim() });
    setAnalyzing(false);

    if (!response?.success) {
      toast.error(response?.message || "Repository analysis failed");
      return;
    }

    const payload = response?.data?.dashboard || response?.data;
    setDashboard(
      payload?.repository || payload?.analysis
        ? payload
        : {
            repository: {
              repoName: response?.data?.repoName || repoUrl,
              githubUrl: repoUrl.trim(),
              entryPoints: [],
              techStack: {},
            },
            analysis: {},
          },
    );
    setMessages([]);
    setChatInput("");
    toast.success(response?.message || "Repository analyzed");
  };

  const sendMessage = async (text) => {
    const question = text.trim();
    if (!question || chatLoading) return;

    const repositoryId = dashboard?.repository?._id;
    if (!repositoryId) {
      toast.info("Repository ID missing. Re-analyze repository once.");
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setChatInput("");
    setChatLoading(true);

    const response = await askRepoQuestion({ repositoryId, question });
    setChatLoading(false);

    if (!response?.success) {
      toast.error(response?.message || "Chat failed");
      return;
    }

    const data = response?.data || {};
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: sanitizeAssistantAnswer(data?.answer || data),
        sources: toList(data?.sources).map(cleanPath).filter(Boolean),
        navigationHelp: toList(data?.navigationHelp),
      },
    ]);
  };

  const copyPath = async (path) => {
    try {
      await navigator.clipboard.writeText(path);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput);
    }
  };

  // ── No dashboard yet: landing / URL-submit view ──────────────────────────
  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-white px-4 py-16">
        <div className="w-full max-w-2xl flex flex-col items-center gap-6">
          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
              Explore a Repository
            </h1>
            <p className="text-gray-500 text-base">
              Paste a GitHub URL to analyze architecture, dependencies, and
              more.
            </p>
          </div>

          {/* URL Input Card */}
          <form
            onSubmit={handleAnalyze}
            className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            <textarea
              required
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              rows={3}
              className="w-full resize-none bg-transparent px-5 pt-4 pb-2 text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <span className="text-xs text-gray-400">
                {analyzing ? PHASES[phaseIndex] : "Press Enter or click →"}
              </span>
              <button
                type="submit"
                disabled={analyzing || !repoUrl.trim()}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                {analyzing ? (
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </form>

          {/* Example hint */}
          <p className="text-xs text-gray-400">
            Example:{" "}
            <span
              onClick={() => setRepoUrl("https://github.com/vercel/next.js")}
              className="text-gray-600 underline underline-offset-2 cursor-pointer hover:text-gray-900"
            >
              https://github.com/vercel/next.js
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ── Dashboard: chat view ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto w-full max-w-2xl space-y-6">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-2">
              <p className="text-lg font-medium text-gray-800">
                Repository analyzed 🎉
              </p>
              <p className="text-sm text-gray-400">
                Ask anything about the codebase below.
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, idx) => (
            <div key={`${msg.role}-${idx}`} className="space-y-2">
              {msg.role === "user" ? (
                // User bubble – right-aligned
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-3 text-sm leading-6 text-gray-800">
                    {msg.text}
                  </div>
                </div>
              ) : (
                // Assistant – full width
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="mt-1 flex-shrink-0 w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5c1.1 0 2 .9 2 2v5a1 1 0 11-2 0v-4H9a1 1 0 110-2h3z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Markdown text={msg.text} />
                    </div>
                  </div>

                  <div className="ml-10">
                    <FilePills
                      title="Related files"
                      files={msg.sources}
                      onCopy={copyPath}
                    />
                    <FilePills
                      title="Suggested starting points"
                      files={msg.navigationHelp}
                      onCopy={copyPath}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {chatLoading && (
            <div className="flex gap-3 items-center">
              <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-3.5 h-3.5 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 5c1.1 0 2 .9 2 2v5a1 1 0 11-2 0v-4H9a1 1 0 110-2h3z" />
                </svg>
              </div>
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}

          {messages.length === 0 && (
            <details className="rounded-xl border border-gray-200 overflow-hidden">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 select-none">
                Repository overview
              </summary>
              <div className="p-4 space-y-4 bg-white">
                <InfoCard title="Architecture Summary">
                  <Markdown text={analysis?.architectureSummary} compact />
                </InfoCard>
                <InfoCard title="Onboarding Guidance">
                  <Markdown
                    text={
                      analysis?.onboardingGuide ||
                      "Start with entry points, then follow critical paths."
                    }
                    compact
                  />
                </InfoCard>
                <InfoCard title="Critical Path Analysis">
                  <Markdown text={analysis?.criticalPathAnalysis} compact />
                </InfoCard>
                <InfoCard title="Tech Stack">
                  {[
                    ["Frontend", repository?.techStack?.frontend],
                    ["Backend", repository?.techStack?.backend],
                    ["Database", repository?.techStack?.database],
                    ["Major Libraries", repository?.techStack?.styling],
                  ].map(([label, val]) => (
                    <p key={label} className="text-xs text-gray-700 mb-1">
                      <span className="font-medium">{label}:</span>{" "}
                      {toList(val).join(", ") || "Not detected"}
                    </p>
                  ))}
                </InfoCard>
                <InfoCard title="Entry Points">
                  <ul className="space-y-1">
                    {entryPoints.length === 0 && (
                      <li className="text-xs text-gray-400">
                        No entry points detected.
                      </li>
                    )}
                    {entryPoints.map((entry) => (
                      <li
                        key={entry.file}
                        className="flex justify-between gap-2 text-xs text-gray-700"
                      >
                        <span className="truncate font-mono">
                          {entry.file}
                          {entry.framework ? ` (${entry.framework})` : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyPath(entry.file)}
                          className="text-blue-600 hover:underline flex-shrink-0"
                        >
                          Copy
                        </button>
                      </li>
                    ))}
                  </ul>
                </InfoCard>
                <InfoCard title="Modules">
                  <div className="space-y-2">
                    {Object.keys(modules).length === 0 && (
                      <p className="text-xs text-gray-400">
                        No modules extracted yet.
                      </p>
                    )}
                    {Object.entries(modules).map(([name, files]) => (
                      <details
                        key={name}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-2"
                      >
                        <summary className="cursor-pointer text-xs font-medium text-gray-700 select-none">
                          {name}
                        </summary>
                        <ul className="mt-2 space-y-1">
                          {toList(files).map((file) => {
                            const normalized = cleanPath(file);
                            return (
                              <li
                                key={`${name}-${normalized}`}
                                className="flex justify-between gap-2 text-xs text-gray-600"
                              >
                                <span className="truncate font-mono">
                                  {normalized}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyPath(normalized)}
                                  className="text-blue-600 hover:underline flex-shrink-0"
                                >
                                  Copy
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </details>
                    ))}
                  </div>
                </InfoCard>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* ── Sticky bottom input bar ─────────────────────────────────────── */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto w-full max-w-2xl space-y-2">
          {/* Suggestion pills */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Chat input */}
          <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 shadow-sm focus-within:border-gray-400 transition-colors">
            <textarea
              ref={textareaRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="Ask a question about the repository…"
              rows={1}
              className="flex-1 resize-none bg-transparent py-1.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 max-h-32 overflow-y-auto"
            />
            <button
              type="button"
              onClick={() => sendMessage(chatInput)}
              disabled={!chatInput.trim() || chatLoading}
              className="mb-1 flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p className="text-center text-xs text-gray-400">
            Press{" "}
            <kbd className="font-mono bg-gray-100 px-1 rounded">Enter</kbd> to
            send ·{" "}
            <kbd className="font-mono bg-gray-100 px-1 rounded">
              Shift+Enter
            </kbd>{" "}
            for new line
          </p>
        </div>
      </div>
    </div>
  );
}
