/**
 * Top bar with page title, theme toggle, and language switcher.
 * Sits above the main content area in the authenticated layout.
 */
"use client";

import { useTheme } from "next-themes";
import { useTransition } from "react";
import { Sun, Moon, Monitor, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";
import { setUserLocale } from "@/i18n/locale";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const [, startTransition] = useTransition();

  /** Switch app locale and persist to cookie */
  function handleLocaleChange(locale: string) {
    startTransition(async () => {
      await setUserLocale(locale);
      window.location.reload();
    });
  }

  return (
    <header className="h-14 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Spacer for mobile menu button */}
        <div className="lg:hidden w-10" />
        {title && (
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Language switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => handleLocaleChange("pt-BR")}>
              🇧🇷 Português
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLocaleChange("en")}>
              🇺🇸 English
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="h-4 w-4 mr-2" />
              {t("themeLight")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="h-4 w-4 mr-2" />
              {t("themeDark")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="h-4 w-4 mr-2" />
              {t("themeSystem")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
