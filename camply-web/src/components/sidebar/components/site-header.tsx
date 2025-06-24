import { Separator } from "./ui/separator"
import { SidebarTrigger } from "./ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { Breadcrumbs, type RouteConfig } from "./breadcrumb"

export interface SiteHeaderProps {
  routeTitles?: Record<string, RouteConfig>
  defaultTitle?: string
  homeRoute?: string
}

export function SiteHeader({ 
  routeTitles = {}, 
  defaultTitle = "App",
  homeRoute = "/"
}: SiteHeaderProps) {
  const breadcrumbConfig = {
    routes: routeTitles,
    defaultTitle,
    homeRoute
  };

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 flex h-14 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumbs config={breadcrumbConfig} />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
