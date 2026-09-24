import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  docsCatalog,
  findDoc,
  flatDocs,
  prevNext,
  searchDocs,
  docsForAppRoute,
} from "@/config/docs-catalog";
import { isKnownAppHref } from "@/config/docs-app-hrefs";

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("docsCatalog", () => {
  it("has unique category slugs", () => {
    const slugs = docsCatalog.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(KEBAB);
    }
  });

  it("has unique page slugs per category and non-empty categories", () => {
    for (const category of docsCatalog) {
      expect(category.pages.length).toBeGreaterThan(0);
      const slugs = category.pages.map((p) => p.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const slug of slugs) {
        expect(slug).toMatch(KEBAB);
      }
    }
  });

  it("resolves related links", () => {
    for (const doc of flatDocs()) {
      for (const ref of doc.related ?? []) {
        const [cat, slug] = ref.split("/");
        expect(findDoc(cat, slug), `missing related ${ref} from ${doc.path}`).toBeDefined();
      }
    }
  });

  it("validates appHrefs against known routes", () => {
    for (const doc of flatDocs()) {
      for (const href of doc.appHrefs ?? []) {
        expect(isKnownAppHref(href), `unknown appHref ${href} on ${doc.path}`).toBe(true);
      }
    }
  });

  it("orders prevNext across the catalog", () => {
    const all = flatDocs();
    const first = all[0];
    const last = all[all.length - 1];
    expect(prevNext(first.category.slug, first.slug).prev).toBeUndefined();
    expect(prevNext(last.category.slug, last.slug).next).toBeUndefined();
    const mid = all[Math.floor(all.length / 2)];
    expect(prevNext(mid.category.slug, mid.slug).prev).toBeDefined();
    expect(prevNext(mid.category.slug, mid.slug).next).toBeDefined();
  });

  it("ranks title matches first in searchDocs", () => {
    const results = searchDocs("quotation");
    expect(results[0]?.title.toLowerCase()).toContain("quotation");
  });

  it("finds docs by app route", () => {
    const docs = docsForAppRoute("/quotations/new");
    expect(docs.some((d) => d.slug === "quotations")).toBe(true);
  });

  it("matches catalog entries to MDX files and loaders", () => {
    const loadersSource = fs.readFileSync(
      path.join(process.cwd(), "src/content/docs-loaders.ts"),
      "utf8",
    );
    for (const doc of flatDocs()) {
      const key = `${doc.category.slug}/${doc.slug}`;
      expect(loadersSource, `missing loader for ${key}`).toContain(`"${key}"`);
      const file = path.join(process.cwd(), "src/content/docs", `${key}.mdx`);
      expect(fs.existsSync(file), `missing file ${file}`).toBe(true);
    }
  });
});
