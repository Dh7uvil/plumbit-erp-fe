"use client";

export function CommDateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-3">
      <span className="bg-white/90 text-muted-foreground rounded-full px-3 py-1 text-xs font-medium shadow-sm dark:bg-card">
        {label}
      </span>
    </div>
  );
}

export function formatMessageDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}
