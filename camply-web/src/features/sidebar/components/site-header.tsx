import { useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { Separator } from "./ui/separator"
import { SidebarTrigger } from "./ui/sidebar"
import { ThemeToggle } from "../../../components/theme-toggle"

const routeTitles: Record<string, { title: string; parent?: string }> = {
  "/desk": { title: "Desk" },
  "/profile/campus": { title: "Campus", parent: "Profile" },
  "/profile/academics": { title: "Academics", parent: "Profile" },
  "/semester/overview": { title: "Overview", parent: "Semester" },
  "/semester/courses": { title: "Courses", parent: "Semester" },
}

export function SiteHeader() {
  const location = useLocation()
  const currentRoute = routeTitles[location.pathname]
  
  const getBreadcrumbs = () => {
    if (!currentRoute) return ["Desk"]
    
    const breadcrumbs = ["Desk"]
    if (currentRoute.parent) {
      breadcrumbs.push(currentRoute.parent)
    }
    if (currentRoute.title !== "Desk") {
      breadcrumbs.push(currentRoute.title)
    }
    
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb} className="flex items-center gap-2">
              <span className={index === breadcrumbs.length - 1 ? "text-foreground" : ""}>
                {crumb}
              </span>
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="h-3 w-3" />
              )}
            </div>
          ))}
        </div>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
