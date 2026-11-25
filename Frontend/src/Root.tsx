import { useEffect, useState } from "react"
import Layout from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import Notes from "./pages/Notes"
import Resume from "./pages/Resume"
import Study from "./pages/Study"
import Tasks from "./pages/Tasks"

export type Route = "dashboard" | "notes" | "tasks" | "resume" | "study"

function getRoute(): Route {
  const h = window.location.hash.replace(/^#\/?/, "")
  if (["notes", "tasks", "resume", "study"].includes(h)) return h as Route
  return "dashboard"
}

export function navigate(r: Route) {
  window.location.hash = `#/${r}`
}

export default function Root() {
  const [route, setRoute] = useState<Route>(getRoute)

  useEffect(() => {
    const onHash = () => setRoute(getRoute())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  const pages: Record<Route, React.ReactNode> = {
    dashboard: <Dashboard navigate={navigate} />,
    notes: <Notes />,
    tasks: <Tasks />,
    resume: <Resume />,
    study: <Study />,
  }

  return (
    <Layout route={route} navigate={navigate}>
      {pages[route]}
    </Layout>
  )
}
