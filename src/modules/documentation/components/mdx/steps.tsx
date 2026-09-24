export function Steps({ children }: { children: React.ReactNode }) {
  return (
    <ol className="not-prose bg-muted/20 my-6 [counter-reset:doc-step] overflow-hidden rounded-xl border">
      {children}
    </ol>
  );
}

export function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="border-border flex gap-4 border-t p-4 first:border-t-0 [counter-increment:doc-step]">
      <span
        className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold before:block before:font-bold before:content-[counter(doc-step)]"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-foreground mb-1 text-sm font-semibold">{title}</p>
        <div className="text-muted-foreground text-sm leading-relaxed [&_p]:my-1">{children}</div>
      </div>
    </li>
  );
}
