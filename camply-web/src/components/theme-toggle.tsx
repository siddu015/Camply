import { Moon, Sun } from "lucide-react"
import { Button } from "./sidebar/components/ui/button"
import { useTheme } from "@/lib/theme-provider"
import { useEffect, useState, useRef } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentIcon, setCurrentIcon] = useState<"sun" | "moon">("moon")
  const [nextIcon, setNextIcon] = useState<"sun" | "moon">("sun")
  const [mounted, setMounted] = useState(false)
  const isInternalChange = useRef(false)

  // Handle initial mounting and set correct icons
  useEffect(() => {
    setMounted(true)
    setCurrentIcon(theme === "dark" ? "sun" : "moon")
    setNextIcon(theme === "dark" ? "moon" : "sun")
  }, [])

  // Update icons when theme changes externally (not from our button)
  useEffect(() => {
    if (!mounted || isAnimating || isInternalChange.current) return
    
    setCurrentIcon(theme === "dark" ? "sun" : "moon")
    setNextIcon(theme === "dark" ? "moon" : "sun")
  }, [theme, mounted, isAnimating])

  const handleToggle = () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    isInternalChange.current = true
    
    // Set the next icon (one that will slide in after animation)
    setNextIcon(theme === "light" ? "sun" : "moon")
    
    // Change theme exactly when animations complete (0.5s total)
    // Set theme immediately but the visual change is controlled by CSS animations
    setTheme(theme === "light" ? "dark" : "light")
    
    // Reset animation state after animations complete
    setTimeout(() => {
      setIsAnimating(false)
      isInternalChange.current = false
      // Update current icon for next toggle
      setCurrentIcon(theme === "light" ? "sun" : "moon")
    }, 500) // Wait for animations to complete (0.25s slide out + 0.25s slide in)
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
        {/* Current icon container - slides down and out */}
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
        
        {/* Next icon container - slides in from above with delay */}
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