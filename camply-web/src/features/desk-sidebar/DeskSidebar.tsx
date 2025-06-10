import type { ComponentProps } from "react"

import { AppSidebar } from "../sidebar/app-sidebar"
import { Sidebar } from "../sidebar/components/ui/sidebar"

type User = {
  name: string
  email: string
  avatar: string
}

interface DeskSidebarProps extends ComponentProps<typeof Sidebar> {
  user: User
}

// Generate desk-specific navigation based on user data
const generateDeskNavigation = (user: User) => {
  const campusItems = [
    {
      name: "Academic Overview",
      url: "/academic-overview",
    },
    {
      name: "Campus Resources",
      url: "/campus-resources",
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
    {
      name: "Timetable",
      url: "/timetable",
    },
    {
      name: "Assignments",
      url: "/assignments",
    },
  ]

  return { campusItems, semesterItems }
}

export function DeskSidebar({ user, ...props }: DeskSidebarProps) {
  const { campusItems, semesterItems } = generateDeskNavigation(user)

  return (
    <AppSidebar 
      user={user}
      campusItems={campusItems}
      semesterItems={semesterItems}
      {...props}
    />
  )
}
