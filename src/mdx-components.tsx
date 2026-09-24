import type { MDXComponents } from "mdx/types";
import Link from "next/link";

import { AppLink } from "@/modules/documentation/components/mdx/app-link";
import { Callout } from "@/modules/documentation/components/mdx/callout";
import { DocLink } from "@/modules/documentation/components/mdx/doc-link";
import { FlowDiagram } from "@/modules/documentation/components/mdx/flow-diagram";
import { ImpactTable } from "@/modules/documentation/components/mdx/impact-table";
import { LifecycleDiagram } from "@/modules/documentation/components/mdx/lifecycle-diagram";
import { Example, Prerequisites } from "@/modules/documentation/components/mdx/prerequisites";
import { StateChangeTable } from "@/modules/documentation/components/mdx/state-change-table";
import { Kbd, StatusFlow } from "@/modules/documentation/components/mdx/status-flow";
import { StatusTable } from "@/modules/documentation/components/mdx/status-table";
import { Step, Steps } from "@/modules/documentation/components/mdx/steps";
import { cn } from "@/shared/lib/cn";

function AnchorHeading({
  as: Tag,
  id,
  className,
  children,
}: {
  as: "h2" | "h3" | "h4";
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag id={id} className={cn("group scroll-mt-24", className)}>
      {id ? (
        <a
          href={`#${id}`}
          className="text-foreground hover:text-primary -ms-6 me-1 hidden opacity-0 transition-opacity group-hover:inline group-hover:opacity-100 lg:inline lg:opacity-0 lg:group-hover:opacity-100"
          aria-label="Link to section"
        >
          #
        </a>
      ) : null}
      {children}
    </Tag>
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ className, ...props }) => (
      <h1 className={cn("sr-only", className)} {...props} />
    ),
    h2: ({ className, id, ...props }) => (
      <AnchorHeading
        as="h2"
        id={id}
        className={cn(
          "text-foreground border-border/70 mt-10 mb-4 border-b pb-2 text-xl font-semibold tracking-tight",
          className,
        )}
        {...props}
      />
    ),
    h3: ({ className, id, ...props }) => (
      <AnchorHeading
        as="h3"
        id={id}
        className={cn("text-foreground mt-8 mb-2 text-lg font-semibold", className)}
        {...props}
      />
    ),
    h4: ({ className, id, ...props }) => (
      <AnchorHeading
        as="h4"
        id={id}
        className={cn("text-foreground mt-6 mb-2 text-base font-semibold", className)}
        {...props}
      />
    ),
    p: ({ className, ...props }) => (
      <p className={cn("text-muted-foreground my-3 leading-7", className)} {...props} />
    ),
    ul: ({ className, ...props }) => (
      <ul className={cn("text-muted-foreground my-3 list-disc space-y-1 ps-6", className)} {...props} />
    ),
    ol: ({ className, ...props }) => (
      <ol className={cn("text-muted-foreground my-3 list-decimal space-y-1 ps-6", className)} {...props} />
    ),
    li: ({ className, ...props }) => <li className={cn("leading-7", className)} {...props} />,
    a: ({ className, href, ...props }) => {
      const isExternal = href?.startsWith("http");
      if (isExternal) {
        return (
          <a
            className={cn("text-primary font-medium underline-offset-4 hover:underline", className)}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        );
      }
      return (
        <Link
          className={cn("text-primary font-medium underline-offset-4 hover:underline", className)}
          href={href ?? "#"}
          {...props}
        />
      );
    },
    blockquote: ({ className, ...props }) => (
      <blockquote
        className={cn("border-primary/30 text-muted-foreground my-4 border-s-4 ps-4 italic", className)}
        {...props}
      />
    ),
    hr: ({ className, ...props }) => (
      <hr className={cn("border-border my-8", className)} {...props} />
    ),
    code: ({ className, ...props }) => (
      <code
        className={cn("bg-muted rounded px-1 py-0.5 font-mono text-[0.875em]", className)}
        {...props}
      />
    ),
    pre: ({ className, ...props }) => (
      <pre
        className={cn(
          "bg-muted/80 border-border my-4 overflow-x-auto rounded-xl border p-4 font-mono text-sm shadow-xs",
          className,
        )}
        {...props}
      />
    ),
    table: ({ className, ...props }) => (
      <div className="my-4 overflow-x-auto rounded-lg border">
        <table className={cn("w-full text-sm", className)} {...props} />
      </div>
    ),
    thead: ({ className, ...props }) => (
      <thead className={cn("bg-muted/50 border-b", className)} {...props} />
    ),
    th: ({ className, ...props }) => (
      <th className={cn("px-3 py-2 text-start font-semibold", className)} {...props} />
    ),
    td: ({ className, ...props }) => (
      <td className={cn("border-border border-t px-3 py-2 align-top", className)} {...props} />
    ),
    strong: ({ className, ...props }) => (
      <strong className={cn("text-foreground font-semibold", className)} {...props} />
    ),
    AppLink,
    Callout,
    DocLink,
    Example,
    FlowDiagram,
    ImpactTable,
    Kbd,
    LifecycleDiagram,
    Prerequisites,
    StateChangeTable,
    StatusFlow,
    StatusTable,
    Step,
    Steps,
    ...components,
  };
}
