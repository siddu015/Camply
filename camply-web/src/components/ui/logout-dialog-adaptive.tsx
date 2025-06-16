import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "../sidebar/lib/utils"
import { WavyBackground } from "./wavy-background"
import { useTheme } from "../../lib/theme-provider"

const LogoutDialog = AlertDialogPrimitive.Root

const LogoutDialogTrigger = AlertDialogPrimitive.Trigger

const LogoutDialogPortal = AlertDialogPrimitive.Portal

const LogoutDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme()
  const isLight = theme === "light"
  
  return (
    <AlertDialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 backdrop-blur-[3px]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=open]:duration-500 data-[state=closed]:duration-300",
        "ease-out",
        isLight ? "bg-gray-900/20" : "bg-black/20",
        className
      )}
      {...props}
      ref={ref}
    >
      <WavyBackground
        colors={isLight 
          ? ["#64748b", "#71717a", "#6b7280", "#9ca3af", "#a1a1aa"] // Smooth professional grays
          : ["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"] // Dark theme colors
        }
        waveWidth={50}
        blur={10}
        speed="fast"
        waveOpacity={isLight ? 0.2 : 0.5}
        backgroundFill={isLight ? "white" : "black"}
      />
    </AlertDialogPrimitive.Overlay>
  )
})
LogoutDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const LogoutDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme()
  const isLight = theme === "light"
  
  return (
    <LogoutDialogPortal>
      <LogoutDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-6 p-8 shadow-2xl",
          "backdrop-blur-xl rounded-3xl",
          isLight 
            ? [
                "bg-white/10 border border-white/20",
                "before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/20 before:via-white/5 before:to-transparent before:pointer-events-none",
                "after:absolute after:inset-[1px] after:rounded-3xl after:bg-gradient-to-t after:from-transparent after:via-white/8 after:to-white/15 after:pointer-events-none",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.15),0_16px_32px_rgba(0,0,0,0.1)]"
              ]
            : [
                "bg-white/10 border border-white/20",
                "before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/20 before:via-white/5 before:to-transparent before:pointer-events-none",
                "after:absolute after:inset-[1px] after:rounded-3xl after:bg-gradient-to-t after:from-transparent after:via-white/8 after:to-white/15 after:pointer-events-none",
                "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.15),0_16px_32px_rgba(0,0,0,0.1)]"
              ],
          "[&>*]:relative [&>*]:z-10",
          className
        )}
        {...props}
      />
    </LogoutDialogPortal>
  )
})
LogoutDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const LogoutDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-3 text-center sm:text-left relative z-10",
        className
      )}
      {...props}
    />
  )
}
LogoutDialogHeader.displayName = "LogoutDialogHeader"

const LogoutDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex justify-end relative z-10",
      className
    )}
    {...props}
  >
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:space-x-3 w-full sm:w-1/2">
      {props.children}
    </div>
  </div>
)
LogoutDialogFooter.displayName = "LogoutDialogFooter"

const LogoutDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme()
  const isLight = theme === "light"
  
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={cn(
        "text-xl font-bold relative z-10",
        isLight ? "text-gray-800" : "text-black/80",
        className
      )}
      {...props}
    />
  )
})
LogoutDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const LogoutDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme()
  const isLight = theme === "light"
  
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={cn(
        "text-sm relative z-10",
        isLight ? "text-gray-600" : "text-black/40",
        className
      )}
      {...props}
    />
  )
})
LogoutDialogDescription.displayName = AlertDialogPrimitive.Description.displayName

const LogoutDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme()
  const isLight = theme === "light"
  
  return (
    <AlertDialogPrimitive.Action
      ref={ref}
      className={cn(
        "group relative inline-flex h-11 items-center justify-center rounded-2xl px-8 py-3 text-sm font-semibold transition-all duration-300",
        isLight 
          ? [
              "bg-gradient-to-br from-red-500/15 via-red-600/10 to-red-700/15 text-red-700 backdrop-blur-lg",
              "border border-red-400/20 shadow-lg hover:shadow-xl",
              "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/10 before:to-transparent before:opacity-0 before:transition-all before:duration-300",
              "after:absolute after:inset-[0.5px] after:rounded-2xl after:bg-gradient-to-t after:from-transparent after:to-white/5 after:opacity-0 after:transition-all after:duration-300",
              "hover:before:opacity-100 hover:after:opacity-100 hover:scale-105 hover:border-red-400/30",
              "hover:bg-gradient-to-br hover:from-red-500/20 hover:via-red-600/15 hover:to-red-700/20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/20 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
            ]
          : [
              "bg-gradient-to-br from-red-400/10 via-red-500/8 to-red-600/10 text-white backdrop-blur-lg",
              "border border-red-300/10 shadow-lg hover:shadow-xl",
              "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 before:transition-all before:duration-300",
              "after:absolute after:inset-[0.5px] after:rounded-2xl after:bg-gradient-to-t after:from-transparent after:to-white/3 after:opacity-0 after:transition-all after:duration-300",
              "hover:before:opacity-100 hover:after:opacity-100 hover:scale-105 hover:border-red-300/20",
              "hover:bg-gradient-to-br hover:from-red-400/15 hover:via-red-500/12 hover:to-red-600/15",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/20 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
            ],
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})
LogoutDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const LogoutDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => {
  const { theme } = useTheme()
  const isLight = theme === "light"
  
  return (
    <AlertDialogPrimitive.Cancel
      ref={ref}
      className={cn(
        "group relative inline-flex h-11 items-center justify-center rounded-2xl px-8 py-3 text-sm font-semibold transition-all duration-300",
        isLight 
          ? [
              "bg-white/5 text-gray-700 backdrop-blur-lg border border-white/10 shadow-lg",
              "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/8 before:to-transparent before:opacity-0 before:transition-all before:duration-300",
              "after:absolute after:inset-[0.5px] after:rounded-2xl after:bg-gradient-to-t after:from-transparent after:to-white/5 after:opacity-0 after:transition-all after:duration-300",
              "hover:before:opacity-100 hover:after:opacity-100 hover:scale-105 hover:bg-white/8 hover:border-white/15",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
            ]
          : [
              "bg-white/2 text-white backdrop-blur-lg border border-white/5 shadow-lg",
              "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/4 before:to-transparent before:opacity-0 before:transition-all before:duration-300",
              "after:absolute after:inset-[0.5px] after:rounded-2xl after:bg-gradient-to-t after:from-transparent after:to-white/2 after:opacity-0 after:transition-all after:duration-300",
              "hover:before:opacity-100 hover:after:opacity-100 hover:scale-105 hover:bg-white/5 hover:border-white/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
            ],
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})
LogoutDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  LogoutDialog,
  LogoutDialogPortal,
  LogoutDialogOverlay,
  LogoutDialogTrigger,
  LogoutDialogContent,
  LogoutDialogHeader,
  LogoutDialogFooter,
  LogoutDialogTitle,
  LogoutDialogDescription,
  LogoutDialogAction,
  LogoutDialogCancel,
} 