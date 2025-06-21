import type { ComponentProps } from "react"
import { BookOpenIcon, CalendarIcon, GraduationCapIcon } from "lucide-react"
import { signOut } from "@/lib/supabase"

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SiteHeader } from "@/components/sidebar/components/site-header"
import type { NavigationGroup } from "@/components/sidebar/components/nav-menu"
import type { User } from "@/components/sidebar/components/nav-user"
import deskRouteConfig from "@/lib/route-config"

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
  // These props are ignored in favor of desk-specific implementations
  navigationGroups: _,
  onLogout: __,
  onProfileClick: ___,
  onSettingsClick: ____,
  homeRoute: _____,
  homeIcon: ______,
  appName: _______,
  ...restProps
}: DeskSidebarWrapperProps) {
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
    console.log('Profile clicked')
  }

  const handleSettingsClick = () => {
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
      homeRoute="/desk"
    />
  )
} 
