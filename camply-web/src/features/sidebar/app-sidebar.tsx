import type { ComponentProps } from "react"
import { Link } from "react-router-dom"
import { GraduationCap } from "lucide-react"
// Alternative icons you can use:
// import { BookOpen, School, Users, Building2, Briefcase, Target } from "lucide-react"

import { NavAcademic } from "../desk-sidebar/components/nav-academic"
import { NavUser } from "../desk-sidebar/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./components/ui/sidebar"

type NavigationItem = {
  name: string
  url: string
}

type User = {
  name: string
  email: string
  avatar: string
}

interface AppSidebarProps extends ComponentProps<typeof Sidebar> {
  user: User
  campusItems: NavigationItem[]
  semesterItems: NavigationItem[]
  homeRoute?: string
}

export function AppSidebar({ 
  user, 
  campusItems, 
  semesterItems, 
  homeRoute = "/desk",
  ...props 
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to={homeRoute}>
                <GraduationCap className="h-6 w-6" />
                <span className="text-lg font-bold">Camply</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavAcademic campusItems={campusItems} semesterItems={semesterItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
