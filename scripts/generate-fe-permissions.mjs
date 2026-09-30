/**
 * Generates src/shared/lib/generated-permissions.ts from the vendored catalog snapshot.
 *
 * Source: src/shared/lib/permissions-catalog.json
 * (copy from plumbit-erp-be/docs/permissions-catalog.json after exporting the backend catalog)
 *
 * Run: npm run generate:permissions
 * Check: npm run generate:permissions:check
 * Sync from sibling backend checkout: npm run sync:permissions
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feRoot = path.join(__dirname, "..");
const catalogJson = path.join(feRoot, "src/shared/lib/permissions-catalog.json");
const outFile = path.join(feRoot, "src/shared/lib/generated-permissions.ts");
const beCatalogJson = path.join(feRoot, "../../plumbit-erp-be/docs/permissions-catalog.json");

function loadCatalog() {
  if (!fs.existsSync(catalogJson)) {
    throw new Error(
      `Missing ${catalogJson}. Copy plumbit-erp-be/docs/permissions-catalog.json here, ` +
        "or run: npm run sync:permissions",
    );
  }
  const raw = fs.readFileSync(catalogJson, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.permissions) || parsed.permissions.length === 0) {
    throw new Error("permissions-catalog.json must contain a non-empty permissions array");
  }
  return parsed;
}

function generateSource(catalog) {
  const permissions = [...catalog.permissions].sort();
  const lines = permissions.map((code) => `  "${code}",`).join("\n");
  const byModuleEntries = Object.entries(catalog.modules ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, resources]) => {
      const resourceEntries = Object.entries(resources)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([resource, actions]) => {
          const actionEntries = [...actions]
            .sort()
            .map((action) => {
              const code = `${module}.${resource}.${action}`;
              return `      ${action}: "${code}",`;
            })
            .join("\n");
          return `    ${resource}: {\n${actionEntries}\n    },`;
        })
        .join("\n");
      return `  ${module}: {\n${resourceEntries}\n  },`;
    })
    .join("\n");

  return `/** Generated from plumbit-erp-be/app/auth/catalog.py — do not edit manually. */
/** Regenerate: npm run generate:permissions */

export const catalogPermissions = [
${lines}
] as const;

export type CatalogPermission = (typeof catalogPermissions)[number];

export const catalogPermissionSet = new Set<string>(catalogPermissions);

export function isCatalogPermission(value: string): value is CatalogPermission {
  return catalogPermissionSet.has(value);
}

export const permissionsByModule = {
${byModuleEntries}
} as const;
`;
}

async function formatSource(source) {
  const config = (await prettier.resolveConfig(outFile)) ?? {};
  return prettier.format(source, { ...config, filepath: outFile });
}

async function buildOutput() {
  const catalog = loadCatalog();
  return formatSource(generateSource(catalog));
}

async function writeOutput(content) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, content);
}

async function main() {
  const checkMode = process.argv.includes("--check");
  const content = await buildOutput();

  if (checkMode) {
    if (!fs.existsSync(outFile)) {
      console.error(`Missing ${outFile}. Run: npm run generate:permissions`);
      process.exit(1);
    }
    const committed = fs.readFileSync(outFile, "utf8");
    if (committed !== content) {
      console.error(
        "generated-permissions.ts is out of date.\nRun: npm run generate:permissions",
      );
      process.exit(1);
    }
    console.log("generated-permissions.ts is up to date");
    return;
  }

  await writeOutput(content);
  const count = loadCatalog().permissions.length;
  console.log(`Generated ${count} permissions in src/shared/lib/generated-permissions.ts`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

export { beCatalogJson, catalogJson, outFile };
