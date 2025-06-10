import type { ComponentType } from "react"
import type { Session } from "@supabase/supabase-js"
import { useUserData } from "@/hooks/useUserData"
import { DeskSidebar } from "../DeskSidebar"
import { SidebarInset, SidebarProvider } from "../../sidebar/components/ui/sidebar"
import { SiteHeader } from "../../sidebar/components/site-header"

interface WithSidebarProps {
  session: Session
}

export function withSidebar<T extends WithSidebarProps>(
  WrappedComponent: ComponentType<Omit<T, 'session'>>
) {
  return function WithSidebarComponent(props: T) {
    const { session, ...otherProps } = props
    const { userStatus, loading } = useUserData(session)

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )
    }

    // Extract user data from the session and userStatus
    const user = {
      name: userStatus.userData?.name || session.user.user_metadata?.full_name || "Student",
      email: userStatus.userData?.email || session.user.email || "",
      avatar: session.user.user_metadata?.avatar_url || "/placeholder.svg",
    }

    return (
      <SidebarProvider>
        <DeskSidebar user={user} />
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 flex-col gap-4 p-4">
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
              <WrappedComponent {...(otherProps as Omit<T, 'session'>)} />
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }
} 