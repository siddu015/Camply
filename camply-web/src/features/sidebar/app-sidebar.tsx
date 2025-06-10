import type { ComponentProps } from "react"
import { Link } from "react-router-dom"
import { ArrowUpCircleIcon } from "lucide-react"

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
}

export function AppSidebar({ user, campusItems, semesterItems, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/dashboard">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Camply</span>
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
