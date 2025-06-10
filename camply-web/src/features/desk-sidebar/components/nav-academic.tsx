import { Link } from "react-router-dom"
import { BookOpenIcon, CalendarIcon, GraduationCapIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "../../sidebar/components/ui/sidebar"

export function NavAcademic({
  campusItems,
  semesterItems,
}: {
  campusItems: {
    name: string
    url: string
  }[]
  semesterItems: {
    name: string
    url: string
  }[]
}) {
  return (
    <>
      <div className="mt-4" />
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-sm font-medium">Campus</SidebarGroupLabel>
        <SidebarSeparator className="my-2" />
        <SidebarGroupContent>
          <SidebarMenu>
            {campusItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <Link to={item.url}>
                    <GraduationCapIcon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <div className="mt-6" />
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-sm font-medium">Semester</SidebarGroupLabel>
        <SidebarSeparator className="my-2" />
        <SidebarGroupContent>
          <SidebarMenu>
            {semesterItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <Link to={item.url}>
                    {item.name === "Current Semester" ? 
                      <CalendarIcon className="h-3 w-3" /> : 
                      <BookOpenIcon className="h-3 w-3" />
                    }
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}
