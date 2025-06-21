import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/sidebar/components/ui/button"
import { useTheme } from "@/lib/theme-provider"
import { useEffect, useState, useRef } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentIcon, setCurrentIcon] = useState<"sun" | "moon">("moon")
  const [nextIcon, setNextIcon] = useState<"sun" | "moon">("sun")
  const [mounted, setMounted] = useState(false)
  const isInternalChange = useRef(false)

  useEffect(() => {
    setMounted(true)
    setCurrentIcon(theme === "dark" ? "sun" : "moon")
    setNextIcon(theme === "dark" ? "moon" : "sun")
  }, [])

  useEffect(() => {
    if (!mounted || isAnimating || isInternalChange.current) return
    
    setCurrentIcon(theme === "dark" ? "sun" : "moon")
    setNextIcon(theme === "dark" ? "moon" : "sun")
  }, [theme, mounted, isAnimating])

  const handleToggle = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    isInternalChange.current = true
    
    setNextIcon(theme === "light" ? "sun" : "moon")
    
    setTheme(theme === "light" ? "dark" : "light")
    
    setTimeout(() => {
      setIsAnimating(false)
      isInternalChange.current = false
      setCurrentIcon(theme === "light" ? "sun" : "moon")
    }, 500)
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative overflow-hidden">
        <div className="h-[1.2rem] w-[1.2rem]"></div>
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="relative overflow-hidden"
    >
      <div className="relative h-[1.2rem] w-[1.2rem]">
        <div
          className={`absolute inset-0 ${
            isAnimating ? "animate-theme-toggle-slide-out" : ""
          }`}
        >
          {currentIcon === "sun" ? (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          )}
        </div>
        
        <div
          className={`absolute inset-0 opacity-0 ${
            isAnimating ? "animate-theme-toggle-slide-in" : ""
          }`}
        >
          {nextIcon === "sun" ? (
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          ) : (
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          )}
        </div>
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}