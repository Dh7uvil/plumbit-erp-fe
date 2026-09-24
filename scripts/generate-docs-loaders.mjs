/**
 * Generates docs-loaders.ts from MDX files on disk.
 * Run: node scripts/generate-docs-loaders.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.join(__dirname, "../src/content/docs");
const outFile = path.join(__dirname, "../src/content/docs-loaders.ts");

const keys = [];

function walk(dir, prefix = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      walk(path.join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name);
    } else if (entry.name.endsWith(".mdx")) {
      const slug = entry.name.replace(/\.mdx$/, "");
      const key = prefix ? `${prefix}/${slug}` : slug;
      keys.push(key);
    }
  }
}

walk(docsRoot);
keys.sort();

const imports = keys
  .map(
    (key) =>
      `  "${key}": () => import("./docs/${key}.mdx"),`,
  )
  .join("\n");

const content = `import "server-only";

import type { ComponentType } from "react";

const docLoaders: Record<string, () => Promise<{ default: ComponentType }>> = {
${imports}
};

export function loadDocComponent(key: string): (() => Promise<{ default: ComponentType }>) | undefined {
  return docLoaders[key];
}

export const docLoaderKeys = ${JSON.stringify(keys)} as const;

export type DocLoaderKey = (typeof docLoaderKeys)[number];
`;

fs.writeFileSync(outFile, content);
console.log(`Generated ${keys.length} loaders in src/content/docs-loaders.ts`);
