import { NavLink, useNavigate } from "react-router-dom";
import InsightsIcon from "@mui/icons-material/Insights";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import GitHubIcon from "@mui/icons-material/GitHub";
import AddCommentIcon from "@mui/icons-material/AddComment";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { getChatSessions } from "../services/repoService";

export default function Sidebar({ open, setOpen }) {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [chatSessions, setChatSessions] = useState([]);

  useEffect(() => {
    let active = true;

    const loadSessions = async () => {
      if (!user?.id) {
        setChatSessions([]);
        return;
      }
      const response = await getChatSessions();
      if (active) setChatSessions(response?.success ? response.data || [] : []);
    };

    loadSessions();
    window.addEventListener("repo-insight:chat-sessions-updated", loadSessions);
    return () => {
      active = false;
      window.removeEventListener("repo-insight:chat-sessions-updated", loadSessions);
    };
  }, [user?.id]);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
     ${
       isActive
         ? "bg-sky-100 text-sky-900 border border-sky-200"
         : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
     }`;

  const handleNewChat = () => {
    navigate("/explore", {
      state: {
        startNewChat: true,
      },
    });
    setOpen(false);
  };

  return (
    <aside
      className={`
        fixed md:static top-0 left-0 z-50 h-full w-72 overflow-y-auto bg-white border-r border-slate-200
        flex flex-col p-5 transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
    >
      <div className="mb-8">
        <NavLink
          to="/dashboard"
          className="mb-2 flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-600 text-white">
            <InsightsIcon fontSize="small" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Repo Insight AI
          </span>
        </NavLink>
        <p className="text-xs text-slate-500">
          Analyze repositories, detect risks, and track improvement over time.
        </p>
      </div>

      <nav className="flex flex-col gap-2 text-sm">
        <NavLink to="/dashboard" onClick={() => setOpen(false)} className={linkClass}>
          <AutoGraphIcon fontSize="small" /> Overview
        </NavLink>
        <NavLink
          to="/explore"
          onClick={() => setOpen(false)}
          className={linkClass}
        >
          <TravelExploreIcon fontSize="small" /> Explore Repository
        </NavLink>
        {user?.role === "admin" && (
          <NavLink to="/admin" onClick={() => setOpen(false)} className={linkClass}>
            <AdminPanelSettingsIcon fontSize="small" /> Admin Panel
          </NavLink>
        )}
      </nav>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-medium text-slate-800 mb-2 flex items-center gap-1">
          <AddCommentIcon fontSize="inherit" /> New Chat
        </p>
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500">
            Start a fresh session and enter a new repository URL.
          </p>
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium py-2"
          >
            Start Repo Chat
          </button>
        </div>
      </div>

      <section className="mt-5 min-h-0" aria-label="Your previous chats">
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Recent chats
        </h2>
        {chatSessions.length === 0 ? (
          <p className="px-1 py-2 text-xs text-slate-400">Your repository chats will appear here.</p>
        ) : (
          <div className="max-h-[38vh] space-y-1 overflow-y-auto">
            {chatSessions.map((session) => (
              <button
                key={session._id}
                type="button"
                title={session.title}
                onClick={() => {
                  navigate("/explore", { state: { openChatSessionId: session._id } });
                  setOpen(false);
                }}
                className="w-full truncate rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {session.title || session.repository?.repoName || "Repository chat"}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-medium text-slate-800 mb-1">Workspace</p>
        <p>AI assistant for repository quality, insights, and architecture decisions.</p>
        <a
          className="inline-flex items-center gap-1 mt-3 text-sky-700 hover:text-sky-800"
          href="https://github.com/team-aeternis"
          target="_blank"
          rel="noreferrer"
        >
          <GitHubIcon fontSize="inherit" /> GitHub
        </a>
      </div>
    </aside>
  );
}
