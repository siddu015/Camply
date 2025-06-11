import type { ReactNode } from "react"
import { AppSidebar } from "../../sidebar/app-sidebar"
import { SiteHeader } from "../../sidebar/components/site-header"
import { SidebarInset, SidebarProvider } from "../../sidebar/components/ui/sidebar"

type User = {
  name: string
  email: string
  avatar: string
}

// App configuration for different sections (homeRoute only, appName is always "Camply")
type AppConfig = {
  homeRoute: string
}

interface LayoutProps {
  children: ReactNode
  user: User
  appConfig?: AppConfig
}

// Generate desk-specific navigation based on user data
const generateDeskNavigation = (user: User) => {
  const campusItems = [
    {
      name: "Campus",
      url: "/profile/campus",
    },
    {
      name: "Academics",
      url: "/profile/academics",
    },
  ]

  const semesterItems = [
    {
      name: "Overview",
      url: "/semester/overview",
    },
    {
      name: "Courses",
      url: "/semester/courses",
    },
  ]

  return { campusItems, semesterItems }
}

export function Layout({ children, user, appConfig }: LayoutProps) {
  const { campusItems, semesterItems } = generateDeskNavigation(user)
  
  // Default to desk configuration, but allow override for homeRoute
  const config = appConfig || { homeRoute: "/desk" }

  return (
    <SidebarProvider>
      <AppSidebar 
        variant="inset" 
        user={user}
        campusItems={campusItems}
        semesterItems={semesterItems}
        homeRoute={config.homeRoute}
      />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col transition-smooth">
          <div className="flex-1 flex items-center justify-center transition-smooth duration-200 ease-in-out p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
