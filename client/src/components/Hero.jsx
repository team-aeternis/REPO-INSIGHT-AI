import AutoGraphIcon from "@mui/icons-material/AutoGraph";

export default function Hero() {
  return (
    <aside
      className="relative isolate flex min-h-[190px] flex-col justify-center overflow-hidden bg-slate-900 px-5 py-5 text-white sm:min-h-[200px] sm:px-8 md:min-h-[210px] lg:h-full lg:min-h-0 lg:justify-between lg:px-12 lg:py-10 xl:px-16"
      style={{
        backgroundImage:
          "linear-gradient(105deg, rgba(15,23,42,.68) 0%, rgba(15,23,42,.52) 52%, rgba(15,23,42,.32) 100%), url('https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1974&auto=format&fit=crop')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute -right-16 -top-16 -z-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-12 -z-10 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />

      <div className="relative z-10 hidden items-center gap-3 lg:flex">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-cyan-100 shadow-sm backdrop-blur">
          <AutoGraphIcon fontSize="small" />
        </span>
        <div>
          <p className="text-sm font-semibold tracking-wide">REPO INSIGHT AI</p>
          <p className="text-xs text-slate-200">A clearer view of your code</p>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl lg:my-auto lg:py-12">
        <p className="mb-3 hidden text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200 lg:block">
          Intelligence for the way you build
        </p>
        <blockquote className="max-w-lg text-xl font-semibold leading-snug tracking-tight text-white sm:text-2xl md:text-3xl lg:text-4xl xl:text-[2.7rem]">
          “The best AI makes complexity easier to understand—and the next step easier to see.”
        </blockquote>
        <p className="mt-2 text-xs text-slate-200 sm:mt-3 sm:text-sm lg:mt-5">
          See the structure. Find the next step.
        </p>
      </div>

      <div className="relative z-10 hidden items-center gap-3 text-xs text-slate-200 lg:flex">
        <span>Code context</span>
        <span className="text-cyan-200">·</span>
        <span>System flows</span>
        <span className="text-cyan-200">·</span>
        <span>Useful insight</span>
      </div>
    </aside>
  );
}
