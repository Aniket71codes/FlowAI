import { BookOpen, FileText, FileUser, LayoutDashboard, PanelLeft, SquareCheckBig } from "lucide-react"
import { useState } from "react"
import RadialGlowBackground from "./ui/radial-glow-background"
import type { Route } from "../Root"

const NAV: { id: Route; icon: React.ElementType; label: string }[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "notes", icon: FileText, label: "Notes" },
  { id: "tasks", icon: SquareCheckBig, label: "Tasks" },
  { id: "resume", icon: FileUser, label: "Resume" },
  { id: "study", icon: BookOpen, label: "Study" },
]

interface Props {
  route: Route
  navigate: (r: Route) => void
  children: React.ReactNode
}

export default function Layout({ route, navigate, children }: Props) {
  const [open, setOpen] = useState(() => window.innerWidth >= 768)

  return (
    <div className="relative isolate flex h-screen w-full overflow-hidden text-white">
      <RadialGlowBackground />

      {/* Sidebar */}
      <aside
        className={
          "flex shrink-0 flex-col border-r border-white/10 bg-black/60 backdrop-blur-xl transition-[width] duration-300 " +
          (open ? "w-60" : "w-0 overflow-hidden border-r-0")
        }
      >
        <div className="flex w-60 items-center justify-between px-5 py-5">
          <span className="text-base font-bold tracking-tight">
            <span className="text-violet-400">⚡</span> FlowAI
          </span>
          <button
            onClick={() => setOpen(false)}
            className="cursor-pointer rounded-md p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
            aria-label="Collapse sidebar"
          >
            <PanelLeft className="size-4" />
          </button>
        </div>

        <nav className="w-60 flex-1 space-y-0.5 px-3">
          {NAV.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => navigate(id)}
              className={
                "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition " +
                (route === id
                  ? "border border-violet-500/30 bg-violet-500/15 text-violet-300"
                  : "text-white/55 hover:bg-white/8 hover:text-white")
              }
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="w-60 border-t border-white/10 px-5 py-4 text-[11px] text-white/25 tracking-wide">
          FlowAI · AI Productivity Platform
        </div>
      </aside>

      {/* Main */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="absolute left-3 top-3 z-10 cursor-pointer rounded-md border border-white/10 bg-black/50 p-2 text-white/60 backdrop-blur hover:text-white"
            aria-label="Open sidebar"
          >
            <PanelLeft className="size-4" />
          </button>
        )}
        {children}
      </main>
    </div>
  )
}
