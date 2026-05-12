import SendIcon from "@mui/icons-material/Send";
import { useEffect, useRef, useState } from "react";
import { submitRepo } from "../services/repoService";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

export default function ExplorePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [repoReady, setRepoReady] = useState(false);
  const [activeRepoUrl, setActiveRepoUrl] = useState("");
  const inFlightRef = useRef(false);

  const handleChange = (e) => {
    e.preventDefault();
    setQuery(e.target.value);
  };

  const handleClick = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading || inFlightRef.current) return;

    try {
      inFlightRef.current = true;
      setIsLoading(true);

      if (!repoReady) {
        const response = await submitRepo({ url: query.trim() });
        if (response?.success) {
          toast.success(response?.message || "Repository submitted successfully");
          setActiveRepoUrl(query.trim());
          setRepoReady(true);
          setQuery("");
        } else {
          toast.info(response?.message || "Failed to submit repository");
        }
      } else {
        toast.info("Chat API integration is the next step.");
        setQuery("");
      }
    } catch (error) {
      toast.error(error?.message || "Request failed");
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    const state = location.state;
    if (!state?.startNewChat) return;

    setQuery("");
    setRepoReady(false);
    setActiveRepoUrl("");
    setIsLoading(false);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);

  return (
    <div className="h-full bg-slate-50 flex flex-col relative">
      {isLoading && (
        <div className="fixed inset-0 z-[3000] bg-slate-900/35 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-lg flex items-center gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
            <p className="text-sm font-medium text-slate-700">
              Analyzing repository, please wait...
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {repoReady ? (
          <>
            <div className="w-full max-w-2xl mb-3 text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
              GitHub URL:{" "}
              <span className="font-medium text-slate-700 break-all">
                {activeRepoUrl}
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mt-1 text-slate-900 mb-3 text-center">
              Chat with Repo Insighter
            </h1>
            <p className="text-slate-600 mb-10 text-center max-w-2xl">
              Ask questions about this repository and get insight-driven help.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight mt-5 text-slate-900 mb-3 text-center">
              Enter a GitHub URL to get insights
            </h1>

            <p className="text-slate-600 mb-2 text-center max-w-2xl">
              Example GitHub URL: https://github.com/vercel/next.js
            </p>

            <p className="text-slate-600 mb-10 text-center max-w-2xl">
              Submit your repository first, then ask questions to get insight.
            </p>
          </>
        )}

        <div className="w-full max-w-2xl relative">
          <textarea
            rows={4}
            name="query"
            onChange={handleChange}
            placeholder={
              repoReady
                ? "Ask a question about this repository..."
                : "Paste GitHub repository URL..."
            }
            value={query}
            disabled={isLoading}
            className="w-full resize-none rounded-2xl border border-slate-300 bg-white p-4 pr-12 text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-500"
          />

          <button
            onClick={handleClick}
            disabled={isLoading || !query.trim()}
            className="absolute bottom-3 right-3 bg-sky-600 hover:bg-sky-700 cursor-pointer text-white p-2 rounded-lg shadow disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <SendIcon fontSize="small" />
          </button>
        </div>
      </div>

      <div className="py-4 text-center text-xs text-slate-400">
        Repo Insight AI · Repository Intelligence Engine
      </div>
    </div>
  );
}
