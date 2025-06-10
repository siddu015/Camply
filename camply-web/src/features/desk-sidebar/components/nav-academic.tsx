import { Link } from "react-router-dom"
import { BookOpenIcon, CalendarIcon, GraduationCapIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Campus</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {campusItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <Link to={item.url}>
                    <GraduationCapIcon />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Semester</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {semesterItems.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <Link to={item.url}>
                    {item.name === "Current Semester" ? <CalendarIcon /> : <BookOpenIcon />}
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
