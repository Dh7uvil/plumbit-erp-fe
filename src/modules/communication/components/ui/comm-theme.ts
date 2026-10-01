/** Google Chat / Material-inspired tokens for the communication module. */
export const commTheme = {
  /** Thread canvas */
  chatBackground:
    "bg-[#f0f4f9] dark:bg-background",
  /** Outgoing bubble */
  bubbleOwn:
    "bg-[#d3e3fd] text-[#041e49] dark:bg-blue-950/50 dark:text-blue-50",
  /** Incoming bubble */
  bubbleOther:
    "bg-white text-foreground shadow-sm dark:bg-card dark:border dark:border-border/60",
  /** Composer bar */
  composerBar: "bg-white dark:bg-background border-t border-border/60",
  /** Sidebar surface */
  sidebar: "bg-white dark:bg-background",
  /** Active list row */
  listActive: "bg-[#e8f0fe] dark:bg-muted",
  /** Active list accent */
  listActiveBar: "bg-[#1a73e8]",
  /** Reaction chip — mine */
  reactionMine:
    "border-[#aecbfa] bg-[#e8f0fe] text-[#174ea6] dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100",
  /** Reaction chip — others */
  reactionOther:
    "border-border/80 bg-white hover:bg-[#f8f9fa] dark:bg-card dark:hover:bg-muted",
} as const;
