import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { DeskSidebarWrapper, DeskSiteHeader } from "./desk-sidebar-wrapper"
import { SidebarInset, SidebarProvider } from "@/components/sidebar/components/ui/sidebar.tsx"
import { CamplyBot } from "@/features/camply-ai/CamplyBot"

type User = {
  name: string
  email: string
  avatar: string
}

type AppConfig = {
  homeRoute: string
}

interface LayoutProps {
  children: ReactNode
  user: User
  appConfig?: AppConfig
}

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

const getCookieValue = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1)
    }
  }
  return null
}

export function Layout({ children, user}: LayoutProps) {
  const { campusItems, semesterItems } = generateDeskNavigation()
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  
  // Get the initial sidebar state from cookie
  const initialSidebarOpen = getCookieValue("sidebar:state") !== "false"
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY < 10) {
        setIsHeaderVisible(true)
      }
      else if (currentScrollY < lastScrollY && currentScrollY > 10) {
        setIsHeaderVisible(true)
      }
      else if (currentScrollY > lastScrollY && currentScrollY > 30) {
        setIsHeaderVisible(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    let timeoutId: NodeJS.Timeout
    const throttledScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 16)
    }

    window.addEventListener('scroll', throttledScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      clearTimeout(timeoutId)
    }
  }, [lastScrollY])

  return (
    <SidebarProvider defaultOpen={initialSidebarOpen}>
      <DeskSidebarWrapper 
        variant="inset"
        user={user}
        campusItems={campusItems}
        semesterItems={semesterItems}
      />
      <SidebarInset className="!p-0 !m-0 !border-0 !rounded-none">
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
      
      <CamplyBot />
    </SidebarProvider>
  )
}
