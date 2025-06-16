import type { ComponentProps } from "react"
import { BookOpenIcon, CalendarIcon, GraduationCapIcon } from "lucide-react"
import { signOut } from "../../../lib/supabase"

import { AppSidebar } from "../../../components/sidebar/app-sidebar"
import { SiteHeader, type RouteConfig } from "../../../components/sidebar/components/site-header"
import type { NavigationGroup } from "../../../components/sidebar/components/nav-menu"
import type { User } from "../../../components/sidebar/components/nav-user"

// Desk-specific route configuration
const deskRouteConfig: Record<string, RouteConfig> = {
  "/desk": { title: "Desk" },
  "/profile/campus": { title: "Campus", parent: "Profile" },
  "/profile/academics": { title: "Academics", parent: "Profile" },
  "/semester/overview": { title: "Overview", parent: "Semester" },
  "/semester/courses": { title: "Courses", parent: "Semester" },
}

interface DeskSidebarWrapperProps extends Partial<ComponentProps<typeof AppSidebar>> {
  user: User
  campusItems: Array<{ name: string; url: string }>
  semesterItems: Array<{ name: string; url: string }>
}

export function DeskSidebarWrapper({ 
  user, 
  campusItems, 
  semesterItems,
  variant,
  // Extract props that would conflict
  navigationGroups: _ignoredNavGroups,
  onLogout: _ignoredOnLogout,
  onProfileClick: _ignoredOnProfile,
  onSettingsClick: _ignoredOnSettings,
  homeRoute: _ignoredHomeRoute,
  homeIcon: _ignoredHomeIcon,
  appName: _ignoredAppName,
  ...restProps
}: DeskSidebarWrapperProps) {
  // Transform legacy props to new navigation groups format
  const navigationGroups: NavigationGroup[] = [
    {
      label: "Profile",
      items: campusItems.map(item => ({
        name: item.name,
        url: item.url,
        icon: GraduationCapIcon
      }))
    },
    {
      label: "Semester", 
      items: semesterItems.map(item => ({
        name: item.name,
        url: item.url,
        icon: item.name === "Current Semester" ? CalendarIcon : BookOpenIcon
      }))
    }
  ]

  const handleLogout = async () => {
    const { error } = await signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const handleProfileClick = () => {
    // TODO: Navigate to profile page
    console.log('Profile clicked')
  }

  const handleSettingsClick = () => {
    // TODO: Navigate to settings page
    console.log('Settings clicked')
  }

  return (
    <AppSidebar
      variant={variant}
      user={user}
      navigationGroups={navigationGroups}
      homeRoute="/desk"
      homeIcon={GraduationCapIcon}
      appName="Camply"
      onLogout={handleLogout}
      onProfileClick={handleProfileClick}
      onSettingsClick={handleSettingsClick}
      {...restProps}
    />
  )
}

export function DeskSiteHeader() {
  return (
    <SiteHeader 
      routeTitles={deskRouteConfig}
      defaultTitle="Desk"
    />
  )
} 