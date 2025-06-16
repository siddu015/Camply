import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar"

export interface NavigationItem {
  name: string
  url: string
  icon?: LucideIcon
}

export interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

interface NavMenuProps {
  groups: NavigationGroup[]
}

export function NavMenu({ groups }: NavMenuProps) {
  return (
    <>
      {groups.map((group, groupIndex) => (
        <div key={group.label}>
          {groupIndex > 0 && <div className="mt-6" />}
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="text-sm font-medium">
              {group.label}
            </SidebarGroupLabel>
            <SidebarSeparator className="my-2" />
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild>
                        <Link to={item.url}>
                          {IconComponent && <IconComponent className="h-4 w-4" />}
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      ))}
    </>
  )
} 