# Glass Effects and Transparent Blur Styling Rules

## Overview

This rule defines standard patterns for implementing glassy, transparent blur effects across all React components in the Camply project. These effects should be theme-aware and consistent.

## Glass Effect Levels

### Basic Glass Effect (Dropdown menus, tooltips)

```tsx
className = "bg-white/10 backdrop-blur-md border border-white/20 shadow-xl";
```

### Medium Glass Effect (Modal overlays, cards)

```tsx
className =
  "backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-2xl";
```

### Advanced Glass Effect (Alert dialogs, complex modals)

```tsx
className={cn(
  "backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10",
  "before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br before:from-white/20 before:via-white/5 before:to-transparent before:pointer-events-none",
  "after:absolute after:inset-[1px] after:rounded-[inherit] after:bg-gradient-to-t after:from-transparent after:via-white/8 after:to-white/15 after:pointer-events-none",
  "[&>*]:relative [&>*]:z-10",
  "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.15),0_16px_32px_rgba(0,0,0,0.1)]"
)}
```

## Theme-Aware Glass Patterns

### Light Theme Glass

- Background: `bg-white/5` to `bg-white/15`
- Borders: `border-white/10` to `border-white/25`
- Text: `text-gray-700` to `text-gray-900`
- Shadows: `shadow-lg` to `shadow-2xl`

### Dark Theme Glass

- Background: `dark:bg-white/3` to `dark:bg-white/8`
- Borders: `dark:border-white/5` to `dark:border-white/15`
- Text: `text-white` to `text-gray-100`
- Shadows: Enhanced with `shadow-xl` to `shadow-2xl`

### Universal Glass (Works in both themes)

- Background: `bg-white/10`
- Borders: `border-white/20`
- Text: `text-foreground` (theme-aware)
- Backdrop: `backdrop-blur-md` or `backdrop-blur-xl`

## Component-Specific Patterns

### Dropdown Menus

```tsx
const DropdownContent = cn(
  "bg-white/10 backdrop-blur-md border border-white/20 text-foreground shadow-xl",
  "rounded-md overflow-hidden"
);
```

### Modal Overlays

```tsx
const ModalOverlay = cn(
  "fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[3px]"
);
```

### Card Components with Glass

```tsx
const GlassCard = cn(
  "backdrop-blur-xl bg-white/8 dark:bg-white/4",
  "border border-white/15 dark:border-white/8",
  "rounded-xl shadow-xl",
  "hover:bg-white/12 dark:hover:bg-white/6 transition-all duration-300"
);
```

### Button Glass Effects

```tsx
const GlassButton = cn(
  "bg-white/5 backdrop-blur-lg border border-white/10",
  "hover:bg-white/10 hover:border-white/20 hover:scale-105",
  "transition-all duration-300 shadow-lg"
);
```

## Advanced Glass Techniques

### Gradient Glass Overlays

```tsx
// Use for sophisticated glass effects
const advancedGlass = {
  background: "backdrop-blur-xl bg-white/10",
  border: "border border-white/20",
  gradientOverlay:
    "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:via-white/5 before:to-transparent",
  innerGlow:
    "after:absolute after:inset-[1px] after:bg-gradient-to-t after:from-transparent after:to-white/15",
  shadows:
    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_4px_12px_rgba(0,0,0,0.15)]",
};
```

### Glass with Depth

```tsx
// Multiple layer approach for maximum depth
const deepGlass = cn(
  "relative overflow-hidden",
  "backdrop-blur-xl bg-white/8",
  "border border-white/20",
  "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/25 before:to-transparent before:opacity-50",
  "after:absolute after:inset-0 after:bg-gradient-to-t after:from-black/5 after:to-transparent",
  "shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.2)]"
);
```

## Blur Intensity Guidelines

### Backdrop Blur Levels

- `backdrop-blur-sm` (4px) - Subtle effects, slight transparency
- `backdrop-blur-md` (12px) - Standard glass effect for dropdowns
- `backdrop-blur-lg` (16px) - Medium glass for cards and panels
- `backdrop-blur-xl` (24px) - Strong glass for modals and dialogs
- `backdrop-blur-2xl` (40px) - Maximum glass for overlays

### When to Use Each Level

- **sm**: Hover effects, subtle highlights
- **md**: Dropdown menus, tooltips, small components
- **lg**: Cards, panels, navigation elements
- **xl**: Modal dialogs, alert dialogs, major overlays
- **2xl**: Full-screen overlays, background elements

## Animation and Transitions

### Glass Hover Effects

```tsx
const glassTsition = cn(
  "transition-all duration-300 ease-out",
  "hover:backdrop-blur-xl hover:bg-white/15",
  "hover:border-white/30 hover:shadow-2xl",
  "hover:scale-[1.02] hover:-translate-y-1"
);
```

### Glass Entrance Animations

```tsx
const glassEntrance = cn(
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
);
```

## Implementation Rules

### 1. Always Use Theme-Aware Patterns

- Never hardcode colors that don't work in both themes
- Use `text-foreground` instead of fixed text colors
- Test in both light and dark modes

### 2. Consistent Opacity Levels

- Light backgrounds: 5-15% opacity (`/5` to `/15`)
- Borders: 10-25% opacity (`/10` to `/25`)
- Overlays: 20-40% opacity for dark backgrounds

### 3. Proper Z-Index Management

```tsx
// When using pseudo-elements for glass effects
const glassZIndex = cn(
  "relative", // Container
  "before:absolute before:z-0", // Background glass layer
  "after:absolute after:z-0", // Overlay glass layer
  "[&>*]:relative [&>*]:z-10" // Content above glass
);
```

### 4. Responsive Glass Effects

```tsx
// Adjust blur intensity for mobile
const responsiveGlass = cn(
  "backdrop-blur-md md:backdrop-blur-xl",
  "bg-white/8 md:bg-white/10",
  "border-white/15 md:border-white/20"
);
```

### 5. Performance Considerations

- Use `backdrop-filter` sparingly on large elements
- Prefer `bg-white/10` over complex gradients for simple effects
- Test performance on lower-end devices

## Common Patterns by Component Type

### Navigation Elements

```tsx
"bg-white/8 backdrop-blur-lg border-b border-white/15";
```

### Form Elements with Glass

```tsx
"bg-white/5 backdrop-blur-md border border-white/20 focus:bg-white/10 focus:border-white/30";
```

### Card Containers

```tsx
"bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl";
```

### Overlay Backgrounds

```tsx
"bg-black/20 backdrop-blur-sm"; // Light overlay
"bg-black/40 backdrop-blur-md"; // Medium overlay
"bg-black/60 backdrop-blur-lg"; // Strong overlay
```

## Testing Checklist

- [ ] Test in light theme
- [ ] Test in dark theme
- [ ] Test with system theme preference
- [ ] Verify text readability
- [ ] Check performance on mobile
- [ ] Validate accessibility contrast ratios
- [ ] Test hover and focus states
- [ ] Verify animations are smooth

## Examples in Codebase

### Good Examples

- `alert-dialog-dark.tsx` - Advanced glass with gradients
- `alert-dialog-light.tsx` - Theme-specific glass styling
- `dropdown-menu.tsx` - Basic glass for UI components

### Reference Components

- Use AlertDialog components for complex glass effects
- Use dropdown patterns for simple glass UI
- Follow the academic form patterns for consistent styling
