import type { ReactNode } from "react"
import { AppSidebar } from "../../sidebar/app-sidebar"
import { SiteHeader } from "../../sidebar/components/site-header"
import { SidebarInset, SidebarProvider } from "../../sidebar/components/ui/sidebar"

type User = {
  name: string
  email: string
  avatar: string
}

interface LayoutProps {
  children: ReactNode
  user: User
}

// Generate desk-specific navigation based on user data
const generateDeskNavigation = (user: User) => {
  const campusItems = [
    {
      name: "Academic Overview",
      url: "/academic-overview",
    },
  ]

  const semesterItems = [
    {
      name: "Current Semester",
      url: "/current-semester",
    },
    {
      name: "Courses",
      url: "/courses",
    },
  ]

  return { campusItems, semesterItems }
}

export function Layout({ children, user }: LayoutProps) {
  const { campusItems, semesterItems } = generateDeskNavigation(user)

  return (
    <SidebarProvider>
      <AppSidebar 
        variant="inset" 
        user={user}
        campusItems={campusItems}
        semesterItems={semesterItems}
      />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
