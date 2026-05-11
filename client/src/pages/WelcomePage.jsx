import BoltIcon from "@mui/icons-material/Bolt";
import CodeIcon from "@mui/icons-material/Code";
import StorageIcon from "@mui/icons-material/Storage";
import TimelineIcon from "@mui/icons-material/Timeline";
import { useSelector } from "react-redux";

export default function WelcomePage({ username }) {
  const { user } = useSelector((state) => {
    return state.auth;
  });

  return (
    <div className="h-full bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
            Welcome to Repo Insight AI{username ? `, ${username}` : ""}
          </h1>

          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Understand your repository health in minutes. Track architecture
            risks, quality trends, and action items that help your team ship
            faster with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <BoltIcon className="text-sky-600" />
            <h3 className="mt-3 font-semibold text-slate-900">
              Repository Insights
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Surface the high-impact hotspots across your codebase and focus
              where it matters first.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <CodeIcon className="text-sky-600" />
            <h3 className="mt-3 font-semibold text-slate-900">
              Smarter Code Reviews
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Generate practical recommendations for readability, maintainability,
              and technical debt reduction.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <StorageIcon className="text-sky-600" />
            <h3 className="mt-3 font-semibold text-slate-900">
              Execution Tracking
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Keep analysis runs, key findings, and repository snapshots in one
              streamlined workflow.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
            <TimelineIcon className="text-sky-600" />
            <h3 className="mt-3 font-semibold text-slate-900">
              Trend Reports
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Understand progress over time with digestible reports for teams
              and stakeholders.
            </p>
          </div>
        </div>

        <div className="text-center mt-14 text-sm text-slate-500 italic">
          Built for engineering teams that want clear repository intelligence
          without noise.
        </div>
      </div>
    </div>
  );
}
