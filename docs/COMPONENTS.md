# Component Documentation

## UI Components (shadcn/ui)

Built from radix-ui primitives with Tailwind CSS styling.

- `Button` — Polymorphic with variants: default, destructive, outline, secondary, ghost, link
- `Input` — Styled text input
- `Textarea` — Auto-resizable text area
- `Label` — Accessible form label
- `Card`, `CardHeader`, `CardContent`, `CardFooter` — Container cards
- `Badge` — Status/category pills with variants: default, secondary, success, warning
- `Dialog` — Modal dialog with overlay
- `Select` — Dropdown select with search
- `Avatar`, `AvatarImage`, `AvatarFallback` — User avatar
- `Separator` — Horizontal/vertical divider
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` — Tabbed interface
- `Progress` — Progress bar
- `Toast`, `Toaster` — Notification system
- `Tooltip` — Hover tooltips
- `DropdownMenu` — Context menus
- `Switch` — Toggle switch

## Auth Components

- `AuthLayout` — Split-panel auth page layout (dark left, white right)
- `LoginForm` — Email/password login with error handling
- `RegisterForm` — Registration with success state
- `SessionProvider` — Client-side NextAuth session wrapper

## Layout Components

- `Sidebar` — Icon-only sidebar with tooltips, user avatar, logout
- `TopBar` — Page header with theme toggle and locale switcher

## Agent Components

- `AgentCard` — Agent display with dropdown actions (edit, duplicate, delete)
- `AgentForm` — Create/edit agent form with emoji picker, template, personality

## Chat Components

- `ChatWindow` — Full streaming chat UI with message history
- `MessageBubble` — Individual message with streaming cursor support
- `ConversationSidebar` — Conversation list with delete
- `ChatInput` — Auto-resize textarea with keyboard shortcuts

## Settings Components

- `SettingsTabs` — Tabbed settings: Profile, Security, API Key, Danger Zone

## Shared Components

- `LoadingSpinner`, `PageLoader` — Loading states
- `EmptyState` — Empty state with optional CTA
