/**
 * Agent Store page — browsable catalog of 8 agent templates.
 * Displays a searchable, filterable grid of template cards with staggered
 * entrance animations. Each card links to the agent creation wizard
 * pre-selecting the chosen template. Client-side filtering by category
 * and free-text search across name, description, and tags.
 */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Template data                                                      */
/* ------------------------------------------------------------------ */

interface Template {
  id: string;
  emoji: string;
  nameKey: string;
  descriptionKey: string;
  category: Category;
  tagKeys: string[];
}

type Category = "all" | "productivity" | "business" | "creative" | "technical";

const TEMPLATES: Template[] = [
  {
    id: "personal-assistant",
    emoji: "\u{1F91D}",
    nameKey: "personalAssistant",
    descriptionKey: "personalAssistantDesc",
    category: "productivity",
    tagKeys: ["tagTasks", "tagOrganization", "tagReminders"],
  },
  {
    id: "business-consultant",
    emoji: "\u{1F4BC}",
    nameKey: "businessConsultant",
    descriptionKey: "businessConsultantDesc",
    category: "business",
    tagKeys: ["tagStrategy", "tagAnalysis", "tagDecisions"],
  },
  {
    id: "professor",
    emoji: "\u{1F393}",
    nameKey: "professor",
    descriptionKey: "professorDesc",
    category: "creative",
    tagKeys: ["tagTeaching", "tagExplanation", "tagLearning"],
  },
  {
    id: "writer",
    emoji: "\u270D\uFE0F",
    nameKey: "writer",
    descriptionKey: "writerDesc",
    category: "creative",
    tagKeys: ["tagCopy", "tagEmails", "tagTexts"],
  },
  {
    id: "dev-assistant",
    emoji: "\u{1F4BB}",
    nameKey: "devAssistant",
    descriptionKey: "devAssistantDesc",
    category: "technical",
    tagKeys: ["tagCode", "tagReview", "tagDebug"],
  },
  {
    id: "coach",
    emoji: "\u{1F9D8}",
    nameKey: "coach",
    descriptionKey: "coachDesc",
    category: "productivity",
    tagKeys: ["tagGoals", "tagMotivation", "tagFocus"],
  },
  {
    id: "attendant",
    emoji: "\u{1F6D2}",
    nameKey: "attendant",
    descriptionKey: "attendantDesc",
    category: "business",
    tagKeys: ["tagFAQ", "tagSupport", "tagSales"],
  },
  {
    id: "free-character",
    emoji: "\u{1F3AD}",
    nameKey: "freeCharacter",
    descriptionKey: "freeCharacterDesc",
    category: "creative",
    tagKeys: ["tagCustom", "tagCreative", "tagFreeform"],
  },
];

const CATEGORIES: Category[] = [
  "all",
  "productivity",
  "business",
  "creative",
  "technical",
];

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.97,
    transition: { duration: 0.2 },
  },
};

/* ------------------------------------------------------------------ */
/*  Page component                                                     */
/* ------------------------------------------------------------------ */

export default function StorePage() {
  const t = useTranslations("store");
  const tt = useTranslations("templates");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return TEMPLATES.filter((tpl) => {
      // Category filter
      if (category !== "all" && tpl.category !== category) return false;
      // Search filter
      if (q) {
        const name = tt(tpl.nameKey).toLowerCase();
        const desc = tt(tpl.descriptionKey).toLowerCase();
        const tags = tpl.tagKeys.map((k) => tt(k).toLowerCase()).join(" ");
        if (
          !name.includes(q) &&
          !desc.includes(q) &&
          !tags.includes(q) &&
          !tpl.id.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [search, category, tt]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/15">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
      </motion.div>

      {/* ── Search + Category filters ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35 }}
        className="space-y-4"
      >
        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-card border-border/50 focus-visible:ring-amber-500/30 focus-visible:border-amber-400"
          />
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
                category === cat
                  ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                  : "bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/40"
              )}
            >
              {t(`category_${cat}`)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Template grid ──────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 text-3xl">
              {"\u{1F50D}"}
            </div>
            <h3 className="font-semibold">{t("noResults")}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("noResultsHint")}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`${category}-${search}`}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filtered.map((tpl) => (
              <TemplateCard key={tpl.id} template={tpl} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Template card                                                      */
/* ------------------------------------------------------------------ */

function TemplateCard({ template }: { template: Template }) {
  const t = useTranslations("store");
  const tt = useTranslations("templates");

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative bg-card rounded-2xl border border-border/50 p-5 shadow-sm hover:shadow-lg hover:border-amber-300/50 dark:hover:border-amber-700/40 transition-all duration-300 flex flex-col"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-amber-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Emoji */}
      <div className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-900/15 flex items-center justify-center text-3xl mb-4 group-hover:scale-105 transition-transform duration-200">
        {template.emoji}
      </div>

      {/* Name */}
      <h3 className="font-semibold text-[15px] tracking-tight mb-1">
        {tt(template.nameKey)}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
        {tt(template.descriptionKey)}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {template.tagKeys.map((tagKey) => (
          <Badge
            key={tagKey}
            variant="secondary"
            className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border-0"
          >
            {tt(tagKey)}
          </Badge>
        ))}
      </div>

      {/* CTA */}
      <Button
        asChild
        variant="outline"
        size="sm"
        className="w-full rounded-xl text-xs hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400 hover:border-amber-200 dark:hover:border-amber-900/50 transition-colors group/btn"
      >
        <Link href={`/agents/new?template=${template.id}`}>
          {t("useTemplate")}
          <ArrowRight className="h-3.5 w-3.5 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </Button>
    </motion.div>
  );
}
