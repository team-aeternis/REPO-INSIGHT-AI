import { useEffect, useState } from "react";
import { API } from "../services/API";
import { toast } from "react-toastify";

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-slate-800 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function AdminPage() {
  const [health, setHealth] = useState(null);
  const [ready, setReady] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [observability, setObservability] = useState(null);
  const [chatSummary, setChatSummary] = useState(null);
  const [repoIdForEval, setRepoIdForEval] = useState("");
  const [repoIdForObs, setRepoIdForObs] = useState("");
  const [repoIdForChat, setRepoIdForChat] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    try {
      const [healthRes, readyRes] = await Promise.all([
        API.get("/api/health"),
        API.get("/api/health/ready"),
      ]);
      setHealth(healthRes?.data?.data || null);
      setReady(readyRes?.data?.data || null);
    } catch (error) {
      toast.error("Failed to fetch health summary");
    }
  };

  const fetchEvaluation = async () => {
    if (!repoIdForEval.trim()) {
      toast.info("Enter repositoryId for evaluation summary");
      return;
    }
    try {
      setLoading(true);
      const res = await API.get(`/api/evaluation/summary/${repoIdForEval.trim()}`);
      setEvaluation(res?.data?.data || null);
    } catch {
      toast.error("Failed to fetch evaluation summary");
    } finally {
      setLoading(false);
    }
  };

  const runGoldenEvaluation = async () => {
    if (!repoIdForEval.trim()) {
      toast.info("Enter repositoryId to run golden evaluation");
      return;
    }
    try {
      setLoading(true);
      await API.post(`/api/evaluation/run/${repoIdForEval.trim()}`);
      toast.success("Golden evaluation completed");
      await fetchEvaluation();
    } catch {
      toast.error("Failed to run golden evaluation");
    } finally {
      setLoading(false);
    }
  };

  const fetchObservability = async () => {
    try {
      setLoading(true);
      const query = repoIdForObs.trim()
        ? `?repositoryId=${encodeURIComponent(repoIdForObs.trim())}`
        : "";
      const res = await API.get(`/api/observability/summary${query}`);
      setObservability(res?.data?.data || null);
    } catch {
      toast.error("Failed to fetch observability summary");
    } finally {
      setLoading(false);
    }
  };

  const fetchChatSummary = async () => {
    if (!repoIdForChat.trim()) {
      toast.info("Enter repositoryId for chat sessions");
      return;
    }
    try {
      setLoading(true);
      const res = await API.get(`/api/chat/sessions/${repoIdForChat.trim()}`);
      setChatSummary(res?.data?.data || null);
    } catch {
      toast.error("Failed to fetch chat sessions summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchObservability();
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Admin Panel</h1>
          <p className="text-xs text-slate-500 mt-1">
            Health, observability, and evaluation insights
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            fetchHealth();
            fetchObservability();
          }}
          className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Health Summary">
          {!health && !ready ? (
            <p className="text-sm text-slate-500">No data found.</p>
          ) : (
            <div className="space-y-1 text-sm text-slate-700">
              <p>
                <span className="font-medium">Status:</span>{" "}
                {health?.status || "No data found"}
              </p>
              <p>
                <span className="font-medium">Ready:</span>{" "}
                {ready?.ready ? "Yes" : ready?.ready === false ? "No" : "No data found"}
              </p>
              <p>
                <span className="font-medium">Database:</span>{" "}
                {ready?.database || "No data found"}
              </p>
              <p>
                <span className="font-medium">Uptime (sec):</span>{" "}
                {health?.uptimeSeconds ?? "No data found"}
              </p>
            </div>
          )}
        </Card>

        <Card title="Observability Summary">
          <div className="space-y-2">
            <input
              value={repoIdForObs}
              onChange={(e) => setRepoIdForObs(e.target.value)}
              placeholder="Optional repositoryId filter"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />
            <button
              type="button"
              onClick={fetchObservability}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Load Observability
            </button>
            <div className="space-y-1 text-sm text-slate-700">
              <p>
                <span className="font-medium">Total events:</span>{" "}
                {observability?.totalEvents ?? "No data found"}
              </p>
              <p>
                <span className="font-medium">Failed events:</span>{" "}
                {observability?.failedEvents ?? "No data found"}
              </p>
              <p>
                <span className="font-medium">Success rate:</span>{" "}
                {observability?.successRate != null
                  ? `${observability.successRate}%`
                  : "No data found"}
              </p>
              <p>
                <span className="font-medium">Avg latency:</span>{" "}
                {observability?.avgResponseTime != null
                  ? `${observability.avgResponseTime} ms`
                  : "No data found"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Evaluation Summary by Repository">
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            value={repoIdForEval}
            onChange={(e) => setRepoIdForEval(e.target.value)}
            placeholder="Enter repositoryId"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <button
            type="button"
            onClick={fetchEvaluation}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Load Evaluation
          </button>
        </div>
        <div className="mt-2">
          <button
            type="button"
            onClick={runGoldenEvaluation}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Run Golden Evaluation
          </button>
        </div>

        <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p>
            <span className="font-medium">Total evaluations:</span>{" "}
            {evaluation?.totalEvaluations ?? "No data found"}
          </p>
          <p>
            <span className="font-medium">Passed:</span>{" "}
            {evaluation?.passedEvaluations ?? "No data found"}
          </p>
          <p>
            <span className="font-medium">Pass rate:</span>{" "}
            {evaluation?.passRate != null ? `${evaluation.passRate}%` : "No data found"}
          </p>
          <p>
            <span className="font-medium">Avg score:</span>{" "}
            {evaluation?.avgScore ?? "No data found"}
          </p>
        </div>
        {evaluation?.latest?.length ? (
          <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              Latest Evaluations
            </div>
            <div className="max-h-48 overflow-auto divide-y divide-slate-100">
              {evaluation.latest.slice(0, 8).map((item) => (
                <div key={item._id} className="px-3 py-2 text-xs text-slate-700">
                  <p className="font-medium">{item.testQuestion || "No question found"}</p>
                  <p>
                    Score: {item.score ?? "No data found"} |{" "}
                    {item.passed ? "Passed" : "Failed"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">No evaluation records found.</p>
        )}
      </Card>

      <Card title="Chat Session Summary by Repository">
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <input
            value={repoIdForChat}
            onChange={(e) => setRepoIdForChat(e.target.value)}
            placeholder="Enter repositoryId"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          />
          <button
            type="button"
            onClick={fetchChatSummary}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            Load Chat Summary
          </button>
        </div>
        <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          <p>
            <span className="font-medium">Total sessions:</span>{" "}
            {chatSummary?.totalSessions ?? "No data found"}
          </p>
          <p>
            <span className="font-medium">Total messages:</span>{" "}
            {chatSummary?.totalMessages ?? "No data found"}
          </p>
        </div>
        {chatSummary?.recentSessions?.length ? (
          <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              Recent Sessions
            </div>
            <div className="max-h-48 overflow-auto divide-y divide-slate-100">
              {chatSummary.recentSessions.slice(0, 8).map((item) => (
                <div key={item._id} className="px-3 py-2 text-xs text-slate-700">
                  <p className="font-medium">Session: {item._id}</p>
                  <p>Messages: {item.messageCount}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">No chat session records found.</p>
        )}
      </Card>
    </div>
  );
}
