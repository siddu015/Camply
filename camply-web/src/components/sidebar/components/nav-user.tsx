"use client"

import { LogOutIcon, MoreVerticalIcon, SettingsIcon, UserCircleIcon, Moon, Sun } from "lucide-react"
import { useState } from "react"
import { useTheme } from "@/lib/theme-provider"

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  LogoutDialog,
  LogoutDialogAction,
  LogoutDialogCancel,
  LogoutDialogContent,
  LogoutDialogDescription,
  LogoutDialogFooter,
  LogoutDialogHeader,
  LogoutDialogTitle,
} from "../../ui/logout-dialog-adaptive"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "./ui/sidebar"

export interface User {
  name: string
  email: string
  avatar: string
}

interface NavUserProps {
  user: User
  onLogout: () => Promise<void>
  onProfileClick?: () => void
  onSettingsClick?: () => void
}

export function NavUser({
  user,
  onLogout,
  onProfileClick,
  onSettingsClick,
}: NavUserProps) {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await onLogout()
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      setIsLoggingOut(false)
      setShowLogoutDialog(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all duration-200 ease-out hover:scale-[1.02]"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onProfileClick}>
              <UserCircleIcon />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSettingsClick}>
              <SettingsIcon />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {theme === "light" ? "Dark" : "Light"} Mode
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowLogoutDialog(true)}
              className="text-600 focus:text-red-800 focus:bg-red-80 dark:focus:bg-red-950/20 transition-all duration-200 ease-out"
            >
              <LogOutIcon />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <LogoutDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <LogoutDialogContent>
            <LogoutDialogHeader>
              <LogoutDialogTitle>Are you absolutely sure?</LogoutDialogTitle>
              <LogoutDialogDescription>
                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
              </LogoutDialogDescription>
            </LogoutDialogHeader>
            <LogoutDialogFooter className="gap-3">
              <LogoutDialogCancel className="flex-1 h-10 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-800">
                Cancel
              </LogoutDialogCancel>
              <LogoutDialogAction 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 h-10 bg-black text-white hover:bg-black/80 disabled:bg-black/50"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </LogoutDialogAction>
            </LogoutDialogFooter>
          </LogoutDialogContent>
        </LogoutDialog>
      </SidebarMenuItem>
    </SidebarMenu>
  )
} 