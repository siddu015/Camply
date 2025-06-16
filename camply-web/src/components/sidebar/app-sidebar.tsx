import type { ComponentProps } from "react"
import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import { GraduationCap } from "lucide-react"

import { NavMenu, type NavigationGroup } from "./components/nav-menu"
import { NavUser, type User } from "./components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./components/ui/sidebar"

interface AppSidebarProps extends ComponentProps<typeof Sidebar> {
  user: User
  navigationGroups: NavigationGroup[]
  homeRoute?: string
  homeIcon?: LucideIcon
  appName?: string
  onLogout: () => Promise<void>
  onProfileClick?: () => void
  onSettingsClick?: () => void
}

export function AppSidebar({ 
  user, 
  navigationGroups,
  homeRoute = "/",
  homeIcon: HomeIcon = GraduationCap,
  appName = "App",
  onLogout,
  onProfileClick,
  onSettingsClick,
  ...props 
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to={homeRoute}>
                <HomeIcon className="h-6 w-6" />
                <span className="text-lg font-bold">{appName}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMenu groups={navigationGroups} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser 
          user={user} 
          onLogout={onLogout}
          onProfileClick={onProfileClick}
          onSettingsClick={onSettingsClick}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
