import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { DeskSidebarWrapper, DeskSiteHeader } from "./desk-sidebar-wrapper"
import { SidebarInset, SidebarProvider } from "@/components/sidebar/components/ui/sidebar.tsx"
import { CamplyBot } from "@/components/CamplyBot.tsx"

type User = {
  name: string
  email: string
  avatar: string
}

// App configuration for different sections (homeRoute only, appName is always "Camply")
type AppConfig = {
  homeRoute: string
}

interface LayoutProps {
  children: ReactNode
  user: User
  appConfig?: AppConfig
}

// Generate desk-specific navigation
const generateDeskNavigation = () => {
  const campusItems = [
    {
      name: "Campus",
      url: "/profile/campus",
    },
    {
      name: "Academics",
      url: "/profile/academics",
    },
  ]

  const semesterItems = [
    {
      name: "Overview",
      url: "/semester/overview",
    },
    {
      name: "Courses",
      url: "/semester/courses",
    },
  ]

  return { campusItems, semesterItems }
}

export function Layout({ children, user, appConfig }: LayoutProps) {
  const { campusItems, semesterItems } = generateDeskNavigation()
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  
  // Default to desk configuration, but allow override for homeRoute
  const config = appConfig || { homeRoute: "/desk" }

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show header when at top of page
      if (currentScrollY < 10) {
        setIsHeaderVisible(true)
      }
      // Show header when scrolling up (and not at very top)
      else if (currentScrollY < lastScrollY && currentScrollY > 10) {
        setIsHeaderVisible(true)
      }
      // Hide header when scrolling down (after some scroll distance)
      else if (currentScrollY > lastScrollY && currentScrollY > 30) {
        setIsHeaderVisible(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    // Throttle scroll events for better performance
    let timeoutId: NodeJS.Timeout
    const throttledScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 16) // ~60fps
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      clearTimeout(timeoutId)
    }
  }, [lastScrollY])

  return (
    <SidebarProvider>
      <DeskSidebarWrapper 
        variant="inset"
        user={user}
        campusItems={campusItems}
        semesterItems={semesterItems}
      />
      <SidebarInset className="!p-0 !m-0 !border-0 !rounded-none">
        {/* Smart Sticky Header - Hides on scroll down, shows on scroll up */}
        <div 
          className={`
            sticky top-0 z-40 transition-transform duration-300 ease-in-out
            bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60
            ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
          `}
        >
          <DeskSiteHeader />
        </div>
        <main className="flex flex-1 flex-col transition-smooth min-h-screen">
          <div className="flex-1 flex items-center justify-center transition-smooth duration-200 ease-in-out p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
      
      {/* Global CamplyBot - Available across all desk views */}
      <CamplyBot />
    </SidebarProvider>
  )
}
