import type { ReactNode } from "react"
import { AppSidebar } from "../../sidebar/app-sidebar"
import { SiteHeader } from "../../sidebar/components/site-header"
import { SidebarInset, SidebarProvider } from "../../sidebar/components/ui/sidebar"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
